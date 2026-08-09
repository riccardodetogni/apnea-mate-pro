// Issues a single-use, 5-minute signing token after password re-auth.
// Called by an authenticated instructor. Returns { token, expires_at }.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const sha256Hex = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const randomToken = () => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
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

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = claims.claims.sub as string
    const email = claims.claims.email as string | undefined

    const body = await req.json().catch(() => ({})) as { password?: string }
    if (!body.password || typeof body.password !== 'string' || !email) {
      return new Response(JSON.stringify({ error: 'invalid_request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // Verify caller is an instructor
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['instructor', 'admin'])
      .maybeSingle()
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'not_instructor' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Re-authenticate via password
    const authClient = createClient(SUPABASE_URL, ANON_KEY)
    const { error: signInErr } = await authClient.auth.signInWithPassword({
      email,
      password: body.password,
    })
    if (signInErr) {
      return new Response(JSON.stringify({ error: 'bad_password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate-limit: at most 3 active (unused, not expired) tokens per user
    const nowIso = new Date().toISOString()
    const { count } = await admin
      .from('signing_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('verifier_user_id', userId)
      .is('used_at', null)
      .gt('expires_at', nowIso)
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const raw = randomToken()
    const hash = await sha256Hex(raw)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: insErr } = await admin.from('signing_tokens').insert({
      verifier_user_id: userId,
      token_hash: hash,
      expires_at: expiresAt,
    })
    if (insErr) {
      return new Response(JSON.stringify({ error: 'server_error', detail: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ token: raw, expires_at: expiresAt }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
