// Redeems a signing token: student presents { dive_log_id, token }, we validate
// the token against signing_tokens, verify the target dive_log belongs to the
// caller, then write a dive_log_signatures row on behalf of the instructor.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const sha256Hex = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const jwt = authHeader.replace('Bearer ', '')
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(jwt)
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const studentId = claims.claims.sub as string

    const body = await req.json().catch(() => ({})) as { dive_log_id?: string; token?: string }
    if (!body.dive_log_id || !body.token) {
      return new Response(JSON.stringify({ error: 'invalid_request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const hash = await sha256Hex(body.token)

    // Fetch token
    const { data: tokenRow } = await admin
      .from('signing_tokens')
      .select('*')
      .eq('token_hash', hash)
      .maybeSingle()
    if (!tokenRow) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (tokenRow.used_at) {
      return new Response(JSON.stringify({ error: 'token_used' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (new Date(tokenRow.expires_at) <= new Date()) {
      return new Response(JSON.stringify({ error: 'token_expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verifier still has instructor role
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', tokenRow.verifier_user_id)
      .in('role', ['instructor', 'admin'])
      .maybeSingle()
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'verifier_not_instructor' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // dive_log must belong to caller and be unverified
    const { data: log } = await admin
      .from('dive_logs')
      .select('id, user_id, verification_status, outing_type')
      .eq('id', body.dive_log_id)
      .maybeSingle()
    if (!log) {
      return new Response(JSON.stringify({ error: 'dive_log_not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (log.user_id !== studentId) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (log.verification_status === 'verified') {
      return new Response(JSON.stringify({ error: 'already_signed' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Only guided dives can be signed; a free outing is a personal diary entry.
    if (log.outing_type !== 'guided') {
      return new Response(JSON.stringify({ error: 'not_guided' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch verifier profile for response
    const { data: verifierProfile } = await admin
      .from('profiles')
      .select('name, last_name')
      .eq('user_id', tokenRow.verifier_user_id)
      .maybeSingle()

    // Write signature (service role bypasses RLS)
    const now = new Date().toISOString()
    const { error: sigErr } = await admin.from('dive_log_signatures').insert({
      dive_log_id: body.dive_log_id,
      verifier_user_id: tokenRow.verifier_user_id,
      method: 'qr',
      credential_confirmed_at: now,
      requested_at: now,
    })
    if (sigErr) {
      return new Response(JSON.stringify({ error: 'sign_failed', detail: sigErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await admin
      .from('dive_logs')
      .update({ verification_status: 'verified' })
      .eq('id', body.dive_log_id)

    await admin
      .from('signing_tokens')
      .update({ used_at: now, dive_log_id: body.dive_log_id })
      .eq('id', tokenRow.id)

    return new Response(
      JSON.stringify({
        ok: true,
        verifier: {
          name: verifierProfile?.name ?? null,
          last_name: verifierProfile?.last_name ?? null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
