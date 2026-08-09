// Generate Legge 70 spreadsheets (XLSX) server-side.
// Doc types:
//   - register   { id }               "Registro delle immersioni" for one register (manager only)
//   - libretti   { id, group_id? }    "Libretto delle immersioni" rows for a register (manager only)
//   - libretto   { }                  personal libretto of the caller
//
// Auth: caller must be authenticated. Authorization is enforced per doc type,
// then data is read with the service role.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const jsonError = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const dash = ''
const hhmm = (v: unknown) => (v ? String(v).slice(0, 5) : dash)
const fmtDate = (v: unknown) => {
  if (!v) return dash
  const d = new Date(String(v).length <= 10 ? `${v}T00:00:00` : String(v))
  if (Number.isNaN(d.getTime())) return dash
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const meters = (v: unknown) => (v == null ? dash : Number(v))
const fullNameOf = (p: { name?: string | null; last_name?: string | null } | undefined | null) =>
  p ? [p.name, p.last_name].filter(Boolean).join(' ') : dash
const apparatus = (v: unknown) => (v === true ? 'Sì' : 'No')
const mixture = (v: unknown) => (v ? String(v) : 'Aria')

type Admin = ReturnType<typeof createClient>

async function loadRegisterBundle(admin: Admin, registerId: string) {
  const { data: reg } = await admin.from('dive_registers').select('*').eq('id', registerId).maybeSingle()
  if (!reg) throw new Error('not_found')
  const [{ data: resps }, { data: parts }] = await Promise.all([
    admin.from('dive_register_responsibles').select('*').eq('register_id', registerId).order('created_at', { ascending: true }),
    admin.from('dive_register_participants').select('*').eq('register_id', registerId).order('created_at', { ascending: true }),
  ])
  const uids = Array.from(new Set([
    ...(resps ?? []).map((r: any) => r.instructor_user_id),
    ...(parts ?? []).map((p: any) => p.user_id).filter(Boolean),
  ])) as string[]
  const logIds = (parts ?? []).map((p: any) => p.dive_log_id).filter(Boolean) as string[]
  const [{ data: profiles }, { data: logs }, { data: sigs }] = await Promise.all([
    uids.length
      ? admin.from('profiles').select('user_id, name, last_name, birth_date').in('user_id', uids)
      : Promise.resolve({ data: [] as any[] }),
    logIds.length
      ? admin.from('dive_logs').select('*').in('id', logIds)
      : Promise.resolve({ data: [] as any[] }),
    logIds.length
      ? admin.from('dive_log_signatures').select('*').in('dive_log_id', logIds)
      : Promise.resolve({ data: [] as any[] }),
  ])
  return {
    reg,
    resps: resps ?? [],
    parts: parts ?? [],
    profMap: new Map<string, any>((profiles ?? []).map((p: any) => [p.user_id, p])),
    logMap: new Map<string, any>((logs ?? []).map((l: any) => [l.id, l])),
    sigMap: new Map<string, any>((sigs ?? []).map((s: any) => [s.dive_log_id, s])),
  }
}

const attendance = (v: string | null) =>
  v === 'present' ? 'Presente' : v === 'absent' ? 'Assente' : v === 'not_participating' ? 'Non partecipa' : dash

function sheetFromAoa(aoa: (string | number)[][], widths: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = widths.map((w) => ({ wch: w }))
  return ws
}

const REGISTER_WIDTHS = [26, 18, 14, 22, 24, 14, 12, 18, 18, 11, 11, 14]
const REGISTER_COLUMNS = [
  'Partecipante', 'Luogo di nascita', 'Data di nascita', 'Brevetto posseduto',
  'Istruttore responsabile', 'Autorespiratore', 'Miscela',
  'Prof. programmata (m)', 'Prof. raggiunta (m)', 'Ora inizio', 'Ora fine', 'Presenza',
]
const BLANK_ROWS = 25

// Multi-day outings (trip / stage) cannot be represented by a single pre-filled
// sheet: the export is an empty official template, one sheet to fill per day.
async function isMultiDayEventRegister(admin: Admin, reg: any) {
  if (!reg.event_id) return false
  const { data } = await admin.from('events').select('event_type').eq('id', reg.event_id).maybeSingle()
  return data?.event_type === 'trip' || data?.event_type === 'stage'
}

function buildBlankRegister() {
  const aoa: (string | number)[][] = [
    ['Registro delle immersioni ai sensi della legge 70/2006'],
    [],
    ['Titolo uscita', '', '', 'Data', ''],
    ['Località', '', '', 'Ora inizio', ''],
    ['Centro / Scuola', '', '', 'Ora fine', ''],
    ['Responsabile/i', '', '', 'Prof. programmata', ''],
    ['', '', '', 'Prof. raggiunta', ''],
    [],
    REGISTER_COLUMNS,
  ]
  for (let i = 0; i < BLANK_ROWS; i++) aoa.push(REGISTER_COLUMNS.map(() => ''))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheetFromAoa(aoa, REGISTER_WIDTHS), 'Registro')
  return { wb, filename: 'registro-immersioni-template.xlsx' }
}

async function buildRegister(admin: Admin, registerId: string) {
  const { reg, resps, parts, profMap, logMap } = await loadRegisterBundle(admin, registerId)
  if (await isMultiDayEventRegister(admin, reg)) return buildBlankRegister()

  const respLabel = resps
    .map((r: any) => `${fullNameOf(profMap.get(r.instructor_user_id))}${r.brevetto_label ? ` (${r.brevetto_label})` : ''}`)
    .join(' — ')

  const aoa: (string | number)[][] = [
    ['Registro delle immersioni ai sensi della legge 70/2006'],
    [],
    ['Titolo uscita', reg.title ?? dash, '', 'Data', fmtDate(reg.register_date)],
    ['Località', reg.spot_label ?? dash, '', 'Ora inizio', hhmm(reg.start_time)],
    ['Centro / Scuola', reg.center_label ?? dash, '', 'Ora fine', hhmm(reg.end_time)],
    ['Responsabile/i', respLabel || dash, '', 'Prof. programmata', meters(reg.planned_depth_m)],
    ['', '', '', 'Prof. raggiunta', meters(reg.max_depth_m)],
    [],
    REGISTER_COLUMNS,
  ]

  const respById = new Map<string, any>(resps.map((r: any) => [r.id, r]))

  for (const p of parts) {
    const prof = p.user_id ? profMap.get(p.user_id) : null
    const log = p.dive_log_id ? logMap.get(p.dive_log_id) : null
    const resp = p.assigned_responsible_id ? respById.get(p.assigned_responsible_id) : resps[0]
    aoa.push([
      p.user_id ? fullNameOf(prof) : `${p.guest_name ?? 'Ospite'} (ospite)`,
      p.guest_birthplace ?? dash,
      p.user_id ? fmtDate(prof?.birth_date) : fmtDate(p.guest_birthdate),
      p.brevetto_label ?? dash,
      resp ? fullNameOf(profMap.get(resp.instructor_user_id)) : dash,
      apparatus(log?.breathing_apparatus),
      mixture(log?.gas_mix),
      meters(log?.planned_depth_m ?? reg.planned_depth_m),
      meters(log?.reached_depth_m ?? reg.max_depth_m),
      hhmm(log?.start_time ?? reg.start_time),
      hhmm(log?.end_time ?? reg.end_time),
      attendance(p.attendance_status),
    ])
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheetFromAoa(aoa, REGISTER_WIDTHS), 'Registro')
  return { wb, filename: `registro-immersioni-${reg.register_date ?? 'uscita'}.xlsx` }
}


const LIBRETTO_HEADER = [
  'Data', 'Località', 'Apnea — inizio', 'Apnea — fine', 'Autorespiratore', 'Miscela',
  'Prof. programmata (m)', 'Prof. raggiunta (m)', 'Centro / Scuola', 'Istruttore', 'Firma',
]
const LIBRETTO_WIDTHS = [12, 28, 14, 14, 15, 12, 20, 20, 26, 24, 26]

function librettoRow(log: any, reg: any, instructor: string, signature: string) {
  return [
    fmtDate(log?.dive_date ?? reg?.register_date),
    log?.spot_label ?? reg?.spot_label ?? dash,
    hhmm(log?.start_time ?? reg?.start_time),
    hhmm(log?.end_time ?? reg?.end_time),
    apparatus(log?.breathing_apparatus),
    mixture(log?.gas_mix),
    meters(log?.planned_depth_m ?? reg?.planned_depth_m),
    meters(log?.reached_depth_m ?? reg?.max_depth_m),
    log?.center_label ?? reg?.center_label ?? dash,
    log?.instructor_label || instructor,
    signature,
  ]
}

async function buildLibrettiForRegister(admin: Admin, registerId: string, groupId: string | null) {
  const { reg, resps, parts, profMap, logMap, sigMap } = await loadRegisterBundle(admin, registerId)
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()
  const rows = groupId ? parts.filter((p: any) => p.assigned_responsible_id === groupId) : parts

  for (const p of rows) {
    const prof = p.user_id ? profMap.get(p.user_id) : null
    const name = p.user_id ? fullNameOf(prof) : (p.guest_name ?? 'Ospite')
    const log = p.dive_log_id ? logMap.get(p.dive_log_id) : null
    const sig = p.dive_log_id ? sigMap.get(p.dive_log_id) : null
    const resp = p.assigned_responsible_id
      ? resps.find((r: any) => r.id === p.assigned_responsible_id)
      : resps[0]
    const instructor = resp ? fullNameOf(profMap.get(resp.instructor_user_id)) : dash
    const signature = sig
      ? `${fullNameOf(profMap.get(sig.verifier_user_id))} — ${fmtDate(sig.created_at)}`
      : dash

    const aoa: (string | number)[][] = [
      ['Libretto delle immersioni ai sensi della legge 70/2006'],
      [],
      ['Cognome e nome', name],
      ['Brevetto posseduto', p.brevetto_label ?? dash],
      ['Data di nascita', p.user_id ? fmtDate(prof?.birth_date) : fmtDate(p.guest_birthdate)],
      [],
      LIBRETTO_HEADER,
      librettoRow(log, reg, instructor, signature),
    ]

    let sheetName = (name || 'Libretto').replace(/[\\/*?:[\]]/g, ' ').slice(0, 28)
    let i = 2
    while (used.has(sheetName)) sheetName = `${sheetName.slice(0, 26)} ${i++}`
    used.add(sheetName)
    XLSX.utils.book_append_sheet(wb, sheetFromAoa(aoa, LIBRETTO_WIDTHS), sheetName)
  }

  if (rows.length === 0) {
    XLSX.utils.book_append_sheet(wb, sheetFromAoa([LIBRETTO_HEADER], LIBRETTO_WIDTHS), 'Libretto')
  }
  return { wb, filename: `libretti-${reg.register_date ?? 'uscita'}.xlsx` }
}

async function buildPersonalLibretto(admin: Admin, userId: string) {
  const [{ data: prof }, { data: logs }] = await Promise.all([
    admin.from('profiles').select('name, last_name, birth_date, instructor_brevetto_label').eq('user_id', userId).maybeSingle(),
    admin.from('dive_logs').select('*').eq('user_id', userId).order('dive_date', { ascending: true }),
  ])
  const logIds = (logs ?? []).map((l: any) => l.id)
  const [{ data: sigs }, { data: parts }] = await Promise.all([
    logIds.length ? admin.from('dive_log_signatures').select('*').in('dive_log_id', logIds) : Promise.resolve({ data: [] as any[] }),
    logIds.length ? admin.from('dive_register_participants').select('dive_log_id, brevetto_label').in('dive_log_id', logIds) : Promise.resolve({ data: [] as any[] }),
  ])
  const sigMap = new Map<string, any>((sigs ?? []).map((s: any) => [s.dive_log_id, s]))
  const brevMap = new Map<string, string | null>((parts ?? []).map((p: any) => [p.dive_log_id, p.brevetto_label]))
  const verifierIds = Array.from(new Set((sigs ?? []).map((s: any) => s.verifier_user_id))) as string[]
  const { data: verifiers } = verifierIds.length
    ? await admin.from('profiles').select('user_id, name, last_name').in('user_id', verifierIds)
    : { data: [] as any[] }
  const vMap = new Map<string, any>((verifiers ?? []).map((v: any) => [v.user_id, v]))

  const { data: cert } = await admin
    .from('certifications')
    .select('agency, level')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const brevetto = (logs ?? []).map((l: any) => brevMap.get(l.id)).find(Boolean)
    ?? prof?.instructor_brevetto_label
    ?? (cert ? [cert.agency, cert.level].filter(Boolean).join(' ') : null)
    ?? dash

  const aoa: (string | number)[][] = [
    ['Libretto delle immersioni ai sensi della legge 70/2006'],
    [],
    ['Cognome e nome', fullNameOf(prof)],
    ['Brevetto posseduto', brevetto],
    ['Data di nascita', fmtDate(prof?.birth_date)],
    [],
    LIBRETTO_HEADER,
  ]

  for (const log of logs ?? []) {
    const sig = sigMap.get(log.id)
    const signature = sig ? `${fullNameOf(vMap.get(sig.verifier_user_id))} — ${fmtDate(sig.created_at)}` : dash
    aoa.push(librettoRow(log, null, log.instructor_label ?? dash, signature))
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheetFromAoa(aoa, LIBRETTO_WIDTHS), 'Libretto')
  return { wb, filename: 'libretto-immersioni.xlsx' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonError(405, 'method_not_allowed')

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return jsonError(401, 'unauthorized')

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return jsonError(401, 'unauthorized')
    const userId = userData.user.id

    const body = await req.json().catch(() => ({})) as {
      type?: string; id?: string; group_id?: string
    }
    const type = body.type
    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    let out: { wb: unknown; filename: string }

    if (type === 'register' || type === 'libretti') {
      if (!body.id) return jsonError(400, 'missing_id')
      const [{ data: allowed, error }, { data: isAdmin }] = await Promise.all([
        admin.rpc('is_dive_register_manager', { _uid: userId, _register_id: body.id }),
        admin.rpc('has_role', { _user_id: userId, _role: 'admin' }),
      ])
      if (error) return jsonError(500, 'server_error')
      if (!allowed && !isAdmin) return jsonError(403, 'forbidden')
      out = type === 'register'
        ? await buildRegister(admin, body.id)
        : await buildLibrettiForRegister(admin, body.id, body.group_id ?? null)
    } else if (type === 'libretto') {
      out = await buildPersonalLibretto(admin, userId)
    } else {
      return jsonError(400, 'invalid_type')
    }

    const bytes = XLSX.write(out.wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${out.filename}"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'server_error'
    console.error('generate-logbook-xlsx failed:', msg)
    if (msg === 'not_found') return jsonError(404, 'not_found')
    return jsonError(500, msg)
  }
})
