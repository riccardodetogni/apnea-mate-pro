import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Admin-only one-shot sender that enqueues a personalized launch email for
// every address on the waitlist via the existing send-transactional-email
// function. Idempotency keys make re-runs safe (no duplicate sends).

const LAUNCH_KEY_PREFIX = 'launch-2026-05-22'
const PAGE_SIZE = 200

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server configuration error' }, 500)
  }

  // ---- Auth: require an admin caller --------------------------------------
  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Missing Authorization header' }, 401)

  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt)
  if (userErr || !userData?.user) {
    return json({ error: 'Invalid auth token' }, 401)
  }
  const callerId = userData.user.id

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
    _user_id: callerId,
    _role: 'admin',
  })
  if (roleErr) return json({ error: 'Role check failed', detail: roleErr.message }, 500)
  if (!isAdmin) return json({ error: 'Admin role required' }, 403)

  // ---- Parse body ----------------------------------------------------------
  let dryRun = false
  let limit: number | null = null
  let onlyEmail: string | null = null
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json()
      dryRun = body?.dryRun === true
      if (typeof body?.limit === 'number' && body.limit > 0) limit = body.limit
      if (typeof body?.onlyEmail === 'string') onlyEmail = body.onlyEmail.toLowerCase().trim()
    }
  } catch {
    // body is optional
  }

  // ---- Read waitlist (paginated) ------------------------------------------
  type Row = { id: string; email: string; language: string | null }
  const rows: Row[] = []
  let from = 0
  while (true) {
    let q = admin
      .from('waitlist')
      .select('id,email,language')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (onlyEmail) q = q.eq('email', onlyEmail)
    const { data, error } = await q
    if (error) return json({ error: 'Failed to read waitlist', detail: error.message }, 500)
    if (!data || data.length === 0) break
    rows.push(...(data as Row[]))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
    if (limit && rows.length >= limit) break
  }
  const targets = limit ? rows.slice(0, limit) : rows

  const byLanguage: Record<string, number> = {}
  for (const r of targets) {
    const lang = r.language ?? 'it'
    byLanguage[lang] = (byLanguage[lang] ?? 0) + 1
  }

  if (dryRun) {
    return json({
      dryRun: true,
      totalRows: targets.length,
      byLanguage,
      sample: targets.slice(0, 5).map((r) => ({ email: r.email, language: r.language ?? 'it' })),
    })
  }

  // ---- Enqueue one transactional send per row -----------------------------
  let enqueued = 0
  let errors = 0
  const errorSamples: Array<{ email: string; error: string }> = []

  for (const r of targets) {
    const lang = (r.language ?? 'it') === 'en' ? 'en' : 'it'
    const templateName = `launch-announcement-${lang}`
    const idempotencyKey = `${LAUNCH_KEY_PREFIX}-${r.id}`
    try {
      const { error } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName,
          recipientEmail: r.email,
          idempotencyKey,
        },
      })
      if (error) {
        errors++
        if (errorSamples.length < 10) errorSamples.push({ email: r.email, error: error.message })
      } else {
        enqueued++
      }
    } catch (e) {
      errors++
      if (errorSamples.length < 10) {
        errorSamples.push({ email: r.email, error: e instanceof Error ? e.message : String(e) })
      }
    }
  }

  return json({
    dryRun: false,
    totalRows: targets.length,
    enqueued,
    errors,
    byLanguage,
    errorSamples,
  })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}