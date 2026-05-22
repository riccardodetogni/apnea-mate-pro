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

  // ---- Skip recipients already sent/queued for this campaign --------------
  // send-transactional-email does NOT enforce idempotency, so we must dedupe
  // here based on prior rows in email_send_log for these templates.
  const alreadySent = new Set<string>()
  {
    let logFrom = 0
    while (true) {
      const { data, error } = await admin
        .from('email_send_log')
        .select('recipient_email')
        .in('template_name', ['launch-announcement-it', 'launch-announcement-en'])
        .in('status', ['sent', 'pending'])
        .range(logFrom, logFrom + 999)
      if (error) return json({ error: 'Failed to read send log', detail: error.message }, 500)
      if (!data || data.length === 0) break
      for (const r of data as Array<{ recipient_email: string }>) {
        alreadySent.add(r.recipient_email.toLowerCase())
      }
      if (data.length < 1000) break
      logFrom += 1000
    }
  }

  const filteredRows = rows.filter((r) => !alreadySent.has(r.email.toLowerCase()))
  const targets = limit ? filteredRows.slice(0, limit) : filteredRows

  const byLanguage: Record<string, number> = {}
  for (const r of targets) {
    const lang = r.language ?? 'it'
    byLanguage[lang] = (byLanguage[lang] ?? 0) + 1
  }

  if (dryRun) {
    return json({
      dryRun: true,
      waitlistRows: rows.length,
      skippedAlreadySent: rows.length - filteredRows.length,
      totalRows: targets.length,
      byLanguage,
      sample: targets.slice(0, 5).map((r) => ({ email: r.email, language: r.language ?? 'it' })),
    })
  }

  // ---- Process in background so client timeouts don't kill mid-run --------
  const work = async () => {
    let enqueued = 0
    let errors = 0
    for (const r of targets) {
      const lang = (r.language ?? 'it') === 'en' ? 'en' : 'it'
      const templateName = `launch-announcement-${lang}`
      const idempotencyKey = `${LAUNCH_KEY_PREFIX}-${r.id}`
      try {
        const { error } = await admin.functions.invoke('send-transactional-email', {
          body: { templateName, recipientEmail: r.email, idempotencyKey },
        })
        if (error) {
          errors++
          console.error('launch send error', r.email, error.message)
        } else {
          enqueued++
        }
      } catch (e) {
        errors++
        console.error('launch send throw', r.email, e instanceof Error ? e.message : String(e))
      }
    }
    console.log(`launch campaign complete: enqueued=${enqueued} errors=${errors}`)
  }

  // @ts-ignore EdgeRuntime is available in the Supabase Edge runtime
  if (typeof EdgeRuntime !== 'undefined' && (EdgeRuntime as any).waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(work())
  } else {
    // fallback: fire-and-forget
    work()
  }

  return json({
    dryRun: false,
    backgrounded: true,
    totalRows: targets.length,
    byLanguage,
    message: 'Sending in background — check email_send_log for progress.',
  })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}