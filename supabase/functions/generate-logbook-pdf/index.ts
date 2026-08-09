// Generate PDFs server-side for the logbook feature.
// Doc types:
//   - dive_log_single      { id }              personal, locale it|en
//   - logbook_all          {}                  personal, locale it|en
//   - register_pack        { id }              legal, always Italian
//   - register_check       { id }              legal, always Italian
//   - libretti_all         { id }              legal, always Italian
//   - libretti_group       { id, group_id }    legal, always Italian
//
// Auth: caller must be authenticated. Ownership/authorization is enforced per
// doc type below. Data is read with the service role AFTER the check so we
// don't fight RLS.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

type DocType =
  | 'dive_log_single'
  | 'logbook_all'
  | 'register_pack'
  | 'register_check'
  | 'libretti_all'
  | 'libretti_group'

type Locale = 'it' | 'en'

const jsonError = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ error, ...extra }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// ---------- i18n (server-side, minimal) ----------
const L = {
  it: {
    appName: 'Apnea Mate',
    diveLog: 'Registro immersione',
    logbook: 'Logbook personale',
    person: 'Persona',
    birth: 'Nato/a il',
    date: 'Data',
    spot: 'Località',
    discipline: 'Disciplina',
    start: 'Ora inizio',
    end: 'Ora fine',
    plannedDepth: 'Profondità pianificata',
    reachedDepth: 'Profondità raggiunta',
    divesCount: 'N. immersioni',
    center: 'Centro / Scuola',
    instructor: 'Istruttore',
    outingType: 'Tipo uscita',
    guided: 'Con istruttore / scuola',
    free: 'Uscita libera',
    verification: 'Firma / verifica',
    verified: 'Firmato',
    unverified: 'Non firmato',
    selfSigned: 'Autofirma',
    notes: 'Note',
    generatedOn: 'Generato il',
    disclaimer:
      'Logbook e Registro sono strumenti messi a disposizione da Apnea Mate ai sensi della L. 70/2026. I dati sono autodichiarati dall\u2019utente.',
    page: 'Pag.',
    of: 'di',
    // register
    registerPack: 'Pacchetto uscita — Registro immersioni',
    registerCheck: 'Registro immersioni — Documento per verifica',
    registerTitle: 'Titolo',
    registerDate: 'Data uscita',
    registerStatus: 'Stato',
    statusDaAprire: 'Da aprire',
    statusAperto: 'Aperto',
    statusChiuso: 'Chiuso',
    openedAt: 'Aperto il',
    closedAt: 'Chiuso il',
    retentionUntil: 'Conservazione fino al',
    maxDepth: 'Profondità massima',
    responsibles: 'Responsabili di gruppo',
    participants: 'Partecipanti',
    guest: 'Ospite',
    brevetto: 'Brevetto',
    safetyChecklist: 'Checklist sicurezza',
    yes: 'Sì',
    no: 'No',
    // libretti
    librettiAll: 'Libretti immersione — Registro',
    librettiGroup: 'Libretti immersione — Gruppo',
    signatureLine: 'Firma verificatore',
    signedAt: 'Firmato il',
    method: 'Metodo',
    methodCredential: 'Credenziali',
    methodQR: 'QR one-time',
    noSignature: 'Non firmato',
    // libretto legale (tabella L. 70/2006)
    librettoLegalTitle: 'Libretto delle immersioni ai sensi della legge 70/2006',
    colName: 'Nominativo',
    colDate: 'Data',
    colPlace: 'Località',
    colStart: 'Ora inizio',
    colEnd: 'Ora fine',
    colApparatus: 'Tipo apparecchio respiratorio',
    colMixture: 'Miscela utilizzata',
    colPlanned: 'Prof. max pianificata',
    colReached: 'Prof. max raggiunta',
    colCenter: 'Denominazione centro',
    colInstructor: 'Istruttore',
    colSignature: 'Firma',
    apparatusApnea: 'Apnea (nessun ARA)',
    mixtureAir: 'Aria',
    responsibleGroup: 'Responsabile',

  },
  en: {
    appName: 'Apnea Mate',
    diveLog: 'Dive record',
    logbook: 'Personal logbook',
    person: 'Person',
    birth: 'Date of birth',
    date: 'Date',
    spot: 'Spot',
    discipline: 'Discipline',
    start: 'Start time',
    end: 'End time',
    plannedDepth: 'Planned depth',
    reachedDepth: 'Reached depth',
    divesCount: 'Number of dives',
    center: 'Center / School',
    instructor: 'Instructor',
    outingType: 'Outing type',
    guided: 'With instructor / school',
    free: 'Free outing',
    verification: 'Signature / verification',
    verified: 'Signed',
    unverified: 'Not signed',
    selfSigned: 'Self-signed',
    notes: 'Notes',
    generatedOn: 'Generated on',
    disclaimer:
      'Logbook and Register are tools provided by Apnea Mate under Italian Law 70/2026. Data is self-declared by the user.',
    page: 'Page',
    of: 'of',
    registerPack: '', registerCheck: '', registerTitle: '', registerDate: '',
    registerStatus: '', statusDaAprire: '', statusAperto: '', statusChiuso: '',
    openedAt: '', closedAt: '', retentionUntil: '', maxDepth: '',
    responsibles: '', participants: '', guest: '', brevetto: '',
    safetyChecklist: '', yes: '', no: '',
    librettiAll: '', librettiGroup: '', signatureLine: '', signedAt: '',
    method: '', methodCredential: '', methodQR: '', noSignature: '',
    librettoLegalTitle: '', colName: '', colDate: '', colPlace: '', colStart: '',
    colEnd: '', colApparatus: '', colMixture: '', colPlanned: '', colReached: '',
    colCenter: '', colInstructor: '', colSignature: '', apparatusApnea: '',
    mixtureAir: '', responsibleGroup: '',
  },
} as const

// ---------- WinAnsi-safe text ----------
// Helvetica (StandardFonts) only supports WinAnsi. Strip anything else so we
// don\u2019t crash on emoji or CJK. Italian accents (à è é ì ò ù) are fine.
const sanitize = (s: unknown): string => {
  if (s === null || s === undefined) return ''
  const str = String(s)
  // Replace common unicode punctuation with ASCII equivalents.
  const remapped = str
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
  // Keep printable WinAnsi range (basic latin + latin-1 supplement).
  let out = ''
  for (const ch of remapped) {
    const code = ch.charCodeAt(0)
    if (code === 10 || code === 13) { out += ch; continue }
    if (code >= 32 && code <= 126) { out += ch; continue }
    if (code >= 160 && code <= 255) { out += ch; continue }
    out += '?'
  }
  return out
}

const fmtDate = (iso: string | null | undefined, locale: Locale): string => {
  if (!iso) return '\u2014'
  try {
    const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso)
    return d.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return String(iso) }
}
const fmtDateTime = (iso: string | null | undefined, locale: Locale): string => {
  if (!iso) return '\u2014'
  try {
    const d = new Date(iso)
    return d.toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return String(iso) }
}

// ---------- Layout helpers ----------
interface LayoutCtx {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  y: number
  pageNo: number
  footerText: string
}

const A4 = { w: 595.28, h: 841.89 }
const MARGIN = 48
const CONTENT_W = A4.w - MARGIN * 2

const newPage = (ctx: LayoutCtx, title: string): void => {
  ctx.page = ctx.doc.addPage([A4.w, A4.h])
  ctx.pageNo += 1
  ctx.y = A4.h - MARGIN
  // Header
  ctx.page.drawText(sanitize(title), {
    x: MARGIN, y: ctx.y, size: 14, font: ctx.bold, color: rgb(0.08, 0.11, 0.2),
  })
  ctx.y -= 8
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y }, end: { x: A4.w - MARGIN, y: ctx.y },
    thickness: 0.6, color: rgb(0.75, 0.78, 0.85),
  })
  ctx.y -= 18
  // Footer will be drawn at the end.
}

const ensureSpace = (ctx: LayoutCtx, needed: number, title: string) => {
  if (ctx.y - needed < MARGIN + 24) newPage(ctx, title)
}

const drawText = (ctx: LayoutCtx, text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {}) => {
  const size = opts.size ?? 10
  const font = opts.bold ? ctx.bold : ctx.font
  const color = opts.color ?? [0.12, 0.15, 0.22]
  const clean = sanitize(text)
  const maxWidth = CONTENT_W - (opts.indent ?? 0)
  // simple word wrap
  const words = clean.split(/\s+/)
  let line = ''
  const lines: string[] = []
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    const width = font.widthOfTextAtSize(test, size)
    if (width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  for (const ln of lines) {
    ctx.page.drawText(ln, {
      x: MARGIN + (opts.indent ?? 0),
      y: ctx.y,
      size,
      font,
      color: rgb(color[0], color[1], color[2]),
    })
    ctx.y -= size + 4
  }
}

const drawKV = (ctx: LayoutCtx, key: string, value: string) => {
  const size = 10
  const keyText = sanitize(key) + ':'
  ctx.page.drawText(keyText, { x: MARGIN, y: ctx.y, size, font: ctx.bold, color: rgb(0.25, 0.28, 0.38) })
  const keyW = ctx.bold.widthOfTextAtSize(keyText, size)
  const valX = MARGIN + keyW + 6
  const valMax = A4.w - MARGIN - valX
  const words = sanitize(value).split(/\s+/)
  let line = ''
  const lines: string[] = []
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.font.widthOfTextAtSize(test, size) > valMax && line) {
      lines.push(line); line = w
    } else { line = test }
  }
  if (line) lines.push(line)
  for (let i = 0; i < lines.length; i++) {
    ctx.page.drawText(lines[i], {
      x: i === 0 ? valX : MARGIN,
      y: ctx.y,
      size,
      font: ctx.font,
      color: rgb(0.12, 0.15, 0.22),
    })
    ctx.y -= size + 4
  }
}

const drawSectionTitle = (ctx: LayoutCtx, title: string, forPage: string) => {
  ensureSpace(ctx, 30, forPage)
  ctx.y -= 4
  ctx.page.drawText(sanitize(title), {
    x: MARGIN, y: ctx.y, size: 11, font: ctx.bold, color: rgb(0.06, 0.35, 0.55),
  })
  ctx.y -= 6
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y }, end: { x: A4.w - MARGIN, y: ctx.y },
    thickness: 0.4, color: rgb(0.85, 0.88, 0.93),
  })
  ctx.y -= 12
}

const drawFooters = (ctx: LayoutCtx, locale: Locale) => {
  const pages = ctx.doc.getPages()
  const total = pages.length
  const l = L[locale]
  pages.forEach((p, i) => {
    const text = `${ctx.footerText}   ·   ${l.page} ${i + 1} ${l.of} ${total}`
    p.drawText(sanitize(text), {
      x: MARGIN, y: 24, size: 8, font: ctx.font, color: rgb(0.45, 0.48, 0.55),
    })
  })
}

// ---------- Data helpers ----------
const fullNameOf = (p?: { name?: string | null; last_name?: string | null } | null): string => {
  if (!p) return '\u2014'
  const first = (p.name ?? '').trim()
  const last = (p.last_name ?? '').trim()
  if (!last) return first || '\u2014'
  if (!first) return last
  // Legacy profiles store the full name in `name` and repeat the surname in `last_name`
  if (first.toLowerCase().endsWith(last.toLowerCase())) return first
  return `${first} ${last}`
}

// Spot labels are stored as "Name · Long description · City" — keep the head only
const shortSpot = (v?: string | null): string => {
  if (!v) return '\u2014'
  const head = String(v).split('\u00b7')[0].trim()
  return head.length > 60 ? `${head.slice(0, 57)}...` : (head || '\u2014')
}

const outingLabel = (t: string, locale: Locale) =>
  t === 'guided' ? L[locale].guided : L[locale].free

const verificationLabel = (status: string, locale: Locale) => {
  if (status === 'verified') return L[locale].verified
  if (status === 'self_signed') return L[locale].selfSigned
  return L[locale].unverified
}

const statusLabel = (s: string, locale: Locale) => {
  if (s === 'chiuso') return L[locale].statusChiuso
  if (s === 'aperto') return L[locale].statusAperto
  return L[locale].statusDaAprire
}

// ---------- Renderers ----------
async function renderDiveLogSingle(
  admin: ReturnType<typeof createClient>,
  ctx: LayoutCtx,
  logId: string,
  locale: Locale,
) {
  const l = L[locale]
  const { data: log } = await admin
    .from('dive_logs')
    .select('*, spot:spots(id, name, location, environment_type)')
    .eq('id', logId)
    .maybeSingle()
  if (!log) throw new Error('not_found')
  const { data: profile } = await admin
    .from('profiles')
    .select('name, last_name, birth_date')
    .eq('user_id', log.user_id)
    .maybeSingle()
  const { data: sig } = await admin
    .from('dive_log_signatures')
    .select('*')
    .eq('dive_log_id', logId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  newPage(ctx, l.diveLog)
  drawKV(ctx, l.date, fmtDate(log.dive_date, locale))
  drawKV(ctx, l.spot, `${log.spot?.name ?? log.spot_label ?? '\u2014'}`)
  drawKV(ctx, l.discipline, log.discipline ?? '\u2014')
  drawKV(ctx, l.outingType, outingLabel(log.outing_type, locale))

  drawSectionTitle(ctx, l.person, l.diveLog)
  drawKV(ctx, l.person, fullNameOf(profile))
  if (profile?.birth_date) drawKV(ctx, l.birth, fmtDate(profile.birth_date, locale))

  drawSectionTitle(ctx, l.diveLog, l.diveLog)
  drawKV(ctx, l.start, log.start_time ? String(log.start_time).slice(0, 5) : '\u2014')
  drawKV(ctx, l.end, log.end_time ? String(log.end_time).slice(0, 5) : '\u2014')
  drawKV(ctx, l.plannedDepth, log.planned_depth_m != null ? `${log.planned_depth_m} m` : '\u2014')
  drawKV(ctx, l.reachedDepth, log.reached_depth_m != null ? `${log.reached_depth_m} m` : '\u2014')
  drawKV(ctx, l.divesCount, log.dives_count != null ? String(log.dives_count) : '\u2014')

  if (log.outing_type === 'guided') {
    drawSectionTitle(ctx, l.center, l.diveLog)
    drawKV(ctx, l.center, log.center_label ?? '\u2014')
    drawKV(ctx, l.instructor, log.instructor_label ?? '\u2014')
  }

  drawSectionTitle(ctx, l.verification, l.diveLog)
  drawKV(ctx, l.verification, verificationLabel(log.verification_status, locale))
  if (sig) {
    drawKV(ctx, l.signedAt, fmtDateTime(sig.created_at, locale))
    drawKV(ctx, l.method, sig.method === 'qr' ? l.methodQR : l.methodCredential)
    if (sig.verifier_brevetto_label) drawKV(ctx, l.brevetto, sig.verifier_brevetto_label)
  }

  if (log.notes) {
    drawSectionTitle(ctx, l.notes, l.diveLog)
    drawText(ctx, log.notes, { size: 10 })
  }

  ctx.y -= 12
  drawText(ctx, l.disclaimer, { size: 8, color: [0.45, 0.48, 0.55] })
}

async function renderLogbookAll(
  admin: ReturnType<typeof createClient>,
  ctx: LayoutCtx,
  userId: string,
  locale: Locale,
) {
  const l = L[locale]
  const { data: profile } = await admin
    .from('profiles').select('name, last_name, birth_date').eq('user_id', userId).maybeSingle()
  const { data: logs } = await admin
    .from('dive_logs')
    .select('*, spot:spots(name, environment_type)')
    .eq('user_id', userId)
    .order('dive_date', { ascending: false })

  newPage(ctx, l.logbook)
  drawKV(ctx, l.person, fullNameOf(profile))
  if (profile?.birth_date) drawKV(ctx, l.birth, fmtDate(profile.birth_date, locale))
  drawKV(ctx, l.generatedOn, fmtDateTime(new Date().toISOString(), locale))
  ctx.y -= 6

  for (const log of logs ?? []) {
    ensureSpace(ctx, 90, l.logbook)
    drawSectionTitle(ctx, `${fmtDate(log.dive_date, locale)} — ${log.discipline ?? ''}`, l.logbook)
    drawKV(ctx, l.spot, log.spot?.name ?? log.spot_label ?? '\u2014')
    drawKV(ctx, l.reachedDepth, log.reached_depth_m != null ? `${log.reached_depth_m} m` : '\u2014')
    drawKV(ctx, l.outingType, outingLabel(log.outing_type, locale))
    drawKV(ctx, l.verification, verificationLabel(log.verification_status, locale))
  }
  if (!logs || logs.length === 0) {
    drawText(ctx, 'No records.', {})
  }
  ctx.y -= 12
  drawText(ctx, l.disclaimer, { size: 8, color: [0.45, 0.48, 0.55] })
}

async function loadRegisterBundle(admin: ReturnType<typeof createClient>, registerId: string) {
  const { data: reg } = await admin.from('dive_registers').select('*').eq('id', registerId).maybeSingle()
  if (!reg) throw new Error('not_found')
  const [{ data: resps }, { data: parts }] = await Promise.all([
    admin.from('dive_register_responsibles').select('*').eq('register_id', registerId).order('created_at', { ascending: true }),
    admin.from('dive_register_participants').select('*').eq('register_id', registerId).order('created_at', { ascending: true }),
  ])
  const respUserIds = (resps ?? []).map((r: any) => r.instructor_user_id)
  const partUserIds = (parts ?? []).map((p: any) => p.user_id).filter(Boolean)
  const logIds = (parts ?? []).map((p: any) => p.dive_log_id).filter(Boolean)
  const allUids = Array.from(new Set([...respUserIds, ...partUserIds])) as string[]
  const [{ data: profiles }, { data: logs }, { data: sigs }] = await Promise.all([
    allUids.length
      ? admin.from('profiles').select('user_id, name, last_name, birth_date').in('user_id', allUids)
      : Promise.resolve({ data: [] as any[] }),
    logIds.length
      ? admin.from('dive_logs').select('id, discipline, reached_depth_m, planned_depth_m, start_time, end_time, center_label, instructor_label, dive_date, spot_label, verification_status, breathing_apparatus, gas_mix').in('id', logIds)
      : Promise.resolve({ data: [] as any[] }),
    logIds.length
      ? admin.from('dive_log_signatures').select('*').in('dive_log_id', logIds)
      : Promise.resolve({ data: [] as any[] }),
  ])
  const profMap = new Map<string, any>((profiles ?? []).map((p: any) => [p.user_id, p]))
  const logMap = new Map<string, any>((logs ?? []).map((l: any) => [l.id, l]))
  const sigMap = new Map<string, any>((sigs ?? []).map((s: any) => [s.dive_log_id, s]))
  return { reg, resps: resps ?? [], parts: parts ?? [], profMap, logMap, sigMap }
}

async function renderRegisterPack(admin: ReturnType<typeof createClient>, ctx: LayoutCtx, registerId: string) {
  const locale: Locale = 'it'
  const l = L.it
  const { reg, resps, parts, profMap } = await loadRegisterBundle(admin, registerId)
  newPage(ctx, l.registerPack)
  drawKV(ctx, l.registerTitle, reg.title ?? '\u2014')
  drawKV(ctx, l.registerDate, fmtDate(reg.register_date, locale))
  drawKV(ctx, l.spot, reg.spot_label ?? '\u2014')
  drawKV(ctx, l.registerStatus, statusLabel(reg.status, locale))
  drawKV(ctx, l.start, reg.start_time ? String(reg.start_time).slice(0, 5) : '\u2014')
  drawKV(ctx, l.end, reg.end_time ? String(reg.end_time).slice(0, 5) : '\u2014')
  drawKV(ctx, l.plannedDepth, reg.planned_depth_m != null ? `${reg.planned_depth_m} m` : '\u2014')
  drawKV(ctx, l.maxDepth, reg.max_depth_m != null ? `${reg.max_depth_m} m` : '\u2014')
  drawKV(ctx, l.center, reg.center_label ?? '\u2014')
  drawKV(ctx, l.generatedOn, fmtDateTime(new Date().toISOString(), locale))

  drawSectionTitle(ctx, l.responsibles, l.registerPack)
  if (resps.length === 0) drawText(ctx, '\u2014', {})
  for (const r of resps) {
    ensureSpace(ctx, 24, l.registerPack)
    const name = fullNameOf(profMap.get(r.instructor_user_id))
    drawKV(ctx, name, r.brevetto_label ?? '\u2014')
  }

  drawSectionTitle(ctx, l.participants, l.registerPack)
  if (parts.length === 0) drawText(ctx, '\u2014', {})
  for (const p of parts) {
    ensureSpace(ctx, 24, l.registerPack)
    const isGuest = !p.user_id
    const name = isGuest ? (p.guest_name ?? l.guest) : fullNameOf(profMap.get(p.user_id))
    const birth = isGuest ? p.guest_birthdate : profMap.get(p.user_id)?.birth_date
    const birthText = birth ? ` (${fmtDate(birth, locale)})` : ''
    drawKV(ctx, `${name}${isGuest ? ` [${l.guest}]` : ''}${birthText}`, p.brevetto_label ?? '\u2014')
  }

  if (reg.safety_checklist && typeof reg.safety_checklist === 'object') {
    drawSectionTitle(ctx, l.safetyChecklist, l.registerPack)
    for (const [k, v] of Object.entries(reg.safety_checklist as Record<string, unknown>)) {
      drawKV(ctx, k, v ? l.yes : l.no)
    }
  }
  ctx.y -= 12
  drawText(ctx, l.disclaimer, { size: 8, color: [0.45, 0.48, 0.55] })
}

async function renderRegisterCheck(admin: ReturnType<typeof createClient>, ctx: LayoutCtx, registerId: string) {
  const locale: Locale = 'it'
  const l = L.it
  const { reg, resps, parts, profMap, logMap, sigMap } = await loadRegisterBundle(admin, registerId)
  newPage(ctx, l.registerCheck)
  drawKV(ctx, l.registerTitle, reg.title ?? '\u2014')
  drawKV(ctx, l.registerDate, fmtDate(reg.register_date, locale))
  drawKV(ctx, l.spot, reg.spot_label ?? '\u2014')
  drawKV(ctx, l.registerStatus, statusLabel(reg.status, locale))
  drawKV(ctx, l.start, reg.start_time ? String(reg.start_time).slice(0, 5) : '\u2014')
  drawKV(ctx, l.end, reg.end_time ? String(reg.end_time).slice(0, 5) : '\u2014')
  if (reg.planned_depth_m != null) drawKV(ctx, l.plannedDepth, `${reg.planned_depth_m} m`)
  if (reg.center_label) drawKV(ctx, l.center, reg.center_label)
  if (reg.opened_at) drawKV(ctx, l.openedAt, fmtDateTime(reg.opened_at, locale))
  if (reg.closed_at) drawKV(ctx, l.closedAt, fmtDateTime(reg.closed_at, locale))
  if (reg.retention_until) drawKV(ctx, l.retentionUntil, fmtDate(reg.retention_until, locale))
  if (reg.max_depth_m != null) drawKV(ctx, l.maxDepth, `${reg.max_depth_m} m`)

  drawSectionTitle(ctx, l.responsibles, l.registerCheck)
  for (const r of resps) {
    const name = fullNameOf(profMap.get(r.instructor_user_id))
    drawKV(ctx, name, r.brevetto_label ?? '\u2014')
  }
  const respName = (id: string | null) => {
    if (!id) return '\u2014'
    const r = resps.find((x: any) => x.id === id)
    return r ? fullNameOf(profMap.get(r.instructor_user_id)) : '\u2014'
  }

  drawSectionTitle(ctx, l.participants, l.registerCheck)
  for (const p of parts) {
    ensureSpace(ctx, 60, l.registerCheck)
    const isGuest = !p.user_id
    const name = isGuest ? (p.guest_name ?? l.guest) : fullNameOf(profMap.get(p.user_id))
    const birth = isGuest ? p.guest_birthdate : profMap.get(p.user_id)?.birth_date
    const log = p.dive_log_id ? logMap.get(p.dive_log_id) : null
    const sig = p.dive_log_id ? sigMap.get(p.dive_log_id) : null
    drawKV(ctx, `${name}${isGuest ? ` [${l.guest}]` : ''}`, `${p.brevetto_label ?? '\u2014'}${birth ? `  ·  ${fmtDate(birth, locale)}` : ''}`)
    drawKV(ctx, `  ${l.responsibles}`, respName(p.assigned_responsible_id))
    if (log) {
      drawKV(ctx, `  ${l.reachedDepth}`, log.reached_depth_m != null ? `${log.reached_depth_m} m` : '\u2014')
      drawKV(ctx, `  ${l.verification}`, verificationLabel(log.verification_status, locale))
    }
    if (sig) {
      drawKV(ctx, `  ${l.signedAt}`, fmtDateTime(sig.created_at, locale))
      drawKV(ctx, `  ${l.method}`, sig.method === 'qr' ? l.methodQR : l.methodCredential)
    }
    ctx.y -= 4
  }

  if (reg.safety_checklist && typeof reg.safety_checklist === 'object') {
    drawSectionTitle(ctx, l.safetyChecklist, l.registerCheck)
    for (const [k, v] of Object.entries(reg.safety_checklist as Record<string, unknown>)) {
      drawKV(ctx, k, v ? l.yes : l.no)
    }
  }
  ctx.y -= 12
  drawText(ctx, l.disclaimer, { size: 8, color: [0.45, 0.48, 0.55] })
}

// ---------- Landscape table helpers (legal "libretto" form) ----------
const LAND = { w: 841.89, h: 595.28 }
const LMARGIN = 28
const LCOLS: { key: string; w: number }[] = [
  { key: 'colName', w: 108 },
  { key: 'colDate', w: 54 },
  { key: 'colPlace', w: 104 },
  { key: 'colStart', w: 40 },
  { key: 'colEnd', w: 40 },
  { key: 'colApparatus', w: 78 },
  { key: 'colMixture', w: 48 },
  { key: 'colPlanned', w: 52 },
  { key: 'colReached', w: 52 },
  { key: 'colCenter', w: 92 },
  { key: 'colInstructor', w: 84 },
  { key: 'colSignature', w: 84 },
]
const LTABLE_W = LCOLS.reduce((a, c) => a + c.w, 0)

const fitText = (font: PDFFont, text: string, size: number, maxW: number): string => {
  let s = sanitize(text)
  if (font.widthOfTextAtSize(s, size) <= maxW) return s
  while (s.length > 1 && font.widthOfTextAtSize(s + '...', size) > maxW) s = s.slice(0, -1)
  return s + '...'
}

const newLandscapePage = (ctx: LayoutCtx, title: string, subtitle: string) => {
  ctx.page = ctx.doc.addPage([LAND.w, LAND.h])
  ctx.pageNo += 1
  ctx.y = LAND.h - LMARGIN
  ctx.page.drawText(sanitize(title), {
    x: LMARGIN, y: ctx.y, size: 13, font: ctx.bold, color: rgb(0.08, 0.11, 0.2),
  })
  ctx.y -= 14
  ctx.page.drawText(fitText(ctx.font, subtitle, 9, LTABLE_W), {
    x: LMARGIN, y: ctx.y, size: 9, font: ctx.font, color: rgb(0.35, 0.38, 0.46),
  })
  ctx.y -= 16
}

const drawTableRow = (
  ctx: LayoutCtx,
  cells: string[],
  opts: { header?: boolean; height?: number } = {},
) => {
  const h = opts.height ?? (opts.header ? 26 : 20)
  const size = opts.header ? 7.5 : 8.5
  const font = opts.header ? ctx.bold : ctx.font
  const top = ctx.y
  const bottom = top - h
  if (opts.header) {
    ctx.page.drawRectangle({
      x: LMARGIN, y: bottom, width: LTABLE_W, height: h, color: rgb(0.93, 0.95, 0.98),
    })
  }
  let x = LMARGIN
  LCOLS.forEach((col, i) => {
    // cell borders
    ctx.page.drawRectangle({
      x, y: bottom, width: col.w, height: h,
      borderWidth: 0.5, borderColor: rgb(0.6, 0.65, 0.72),
    })
    const raw = cells[i] ?? ''
    if (opts.header) {
      // wrap header into up to two lines
      const words = sanitize(raw).split(' ')
      const lines: string[] = []
      let line = ''
      for (const w of words) {
        const test = line ? `${line} ${w}` : w
        if (font.widthOfTextAtSize(test, size) > col.w - 6 && line) { lines.push(line); line = w }
        else line = test
      }
      if (line) lines.push(line)
      const shown = lines.slice(0, 2)
      shown.forEach((ln, k) => {
        ctx.page!.drawText(fitText(font, ln, size, col.w - 6), {
          x: x + 3, y: bottom + h - 10 - k * (size + 2), size, font,
          color: rgb(0.15, 0.18, 0.26),
        })
      })
    } else if (!raw && i === LCOLS.length - 1) {
      // blank signature cell: leave a ruled line for the pen signature
      ctx.page.drawLine({
        start: { x: x + 5, y: bottom + 6 },
        end: { x: x + col.w - 5, y: bottom + 6 },
        thickness: 0.5,
        color: rgb(0.7, 0.74, 0.8),
      })
    } else {
      ctx.page.drawText(fitText(font, raw, size, col.w - 6), {
        x: x + 3, y: bottom + h / 2 - size / 2 + 1, size, font,
        color: rgb(0.12, 0.15, 0.22),
      })
    }
    x += col.w
  })
  ctx.y = bottom
}

async function renderLibretti(
  admin: ReturnType<typeof createClient>,
  ctx: LayoutCtx,
  registerId: string,
  groupIdOnly: string | null,
) {
  const locale: Locale = 'it'
  const l = L.it
  const { reg, resps, parts, profMap, logMap, sigMap } = await loadRegisterBundle(admin, registerId)
  const groups = groupIdOnly ? resps.filter((r: any) => r.id === groupIdOnly) : resps
  const title = l.librettoLegalTitle
  const subtitle = `${reg.title ?? '\u2014'}  ·  ${fmtDate(reg.register_date, locale)}  ·  ${shortSpot(reg.spot_label)}`
  const headerCells = LCOLS.map((c) => (l as any)[c.key] as string)

  newLandscapePage(ctx, title, subtitle)
  drawTableRow(ctx, headerCells, { header: true })

  const dash = '\u2014'
  const hhmm = (v: string | null | undefined) => (v ? String(v).slice(0, 5) : dash)
  const meters = (v: number | null | undefined) => (v != null ? `${v} m` : dash)

  const fallbackResp = resps.length > 0 ? fullNameOf(profMap.get(resps[0].instructor_user_id)) : dash

  const renderGroup = (r: any | null) => {
    const respName = r ? fullNameOf(profMap.get(r.instructor_user_id)) : fallbackResp
    const groupParts = r
      ? parts.filter((p: any) => p.assigned_responsible_id === r.id)
      : parts.filter((p: any) => !p.assigned_responsible_id)
    if (groupParts.length === 0) return

    if (r && resps.length > 1) {
      if (ctx.y - 40 < LMARGIN + 20) {
        newLandscapePage(ctx, title, subtitle)
        drawTableRow(ctx, headerCells, { header: true })
      }
      ctx.y -= 12
      ctx.page.drawText(
        sanitize(`${l.responsibleGroup}: ${respName}${r.brevetto_label ? ` · ${r.brevetto_label}` : ''}`),
        { x: LMARGIN, y: ctx.y, size: 9, font: ctx.bold, color: rgb(0.06, 0.35, 0.55) },
      )
      ctx.y -= 6
    }

    for (const p of groupParts) {
      if (ctx.y - 22 < LMARGIN + 20) {
        newLandscapePage(ctx, title, subtitle)
        drawTableRow(ctx, headerCells, { header: true })
      }
      const isGuest = !p.user_id
      const name = isGuest ? (p.guest_name ?? l.guest) : fullNameOf(profMap.get(p.user_id))
      const log = p.dive_log_id ? logMap.get(p.dive_log_id) : null
      const sig = p.dive_log_id ? sigMap.get(p.dive_log_id) : null
      const signature = sig
        ? `${respName !== dash ? respName : ''} ${fmtDate(sig.created_at, locale)}`.trim()
        : ''
      drawTableRow(ctx, [
        `${name}${isGuest ? ` [${l.guest}]` : ''}`,
        fmtDate(log?.dive_date ?? reg.register_date, locale),
        shortSpot(log?.spot_label ?? reg.spot_label),
        hhmm(log?.start_time ?? reg.start_time),
        hhmm(log?.end_time ?? reg.end_time),
        log?.breathing_apparatus ? l.yes : l.apparatusApnea,
        log?.gas_mix ?? l.mixtureAir,
        meters(log?.planned_depth_m ?? reg.planned_depth_m),
        meters(log?.reached_depth_m ?? reg.max_depth_m),
        log?.center_label ?? reg.center_label ?? dash,
        log?.instructor_label ?? respName,
        signature,
      ])
    }
  }

  for (const r of groups) renderGroup(r)
  if (!groupIdOnly) renderGroup(null)

  ctx.y -= 14
  if (ctx.y < LMARGIN + 20) newLandscapePage(ctx, title, subtitle)
  ctx.page.drawText(fitText(ctx.font, l.disclaimer, 8, LTABLE_W), {
    x: LMARGIN, y: ctx.y, size: 8, font: ctx.font, color: rgb(0.45, 0.48, 0.55),
  })
}


// ---------- Authorization ----------
async function assertRegisterManager(
  admin: ReturnType<typeof createClient>,
  userId: string,
  registerId: string,
): Promise<void> {
  const { data, error } = await admin.rpc('is_dive_register_manager', {
    _uid: userId, _register_id: registerId,
  })
  if (error) throw new Error('server_error:' + error.message)
  if (!data) throw new Error('forbidden')
}

async function assertCanViewDiveLog(
  admin: ReturnType<typeof createClient>,
  userId: string,
  logId: string,
): Promise<void> {
  const { data, error } = await admin.rpc('can_view_dive_log', {
    _uid: userId, _log_id: logId,
  })
  if (error) throw new Error('server_error:' + error.message)
  if (!data) throw new Error('forbidden')
}

// ---------- Entry ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonError(405, 'method_not_allowed')

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return jsonError(401, 'unauthorized')

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
  if (claimsErr || !claims?.claims) return jsonError(401, 'unauthorized')
  const userId = claims.claims.sub as string

  let body: { type?: DocType; id?: string; group_id?: string; locale?: Locale } = {}
  try { body = await req.json() } catch { return jsonError(400, 'invalid_json') }

  const { type, id, group_id } = body
  const locale: Locale = body.locale === 'en' ? 'en' : 'it'
  if (!type) return jsonError(400, 'missing_type')

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  try {
    // Authorization
    if (type === 'dive_log_single') {
      if (!id) return jsonError(400, 'missing_id')
      await assertCanViewDiveLog(admin, userId, id)
    } else if (type === 'logbook_all') {
      // caller reads own logs — always allowed
    } else if (type === 'register_pack' || type === 'register_check'
               || type === 'libretti_all' || type === 'libretti_group') {
      if (!id) return jsonError(400, 'missing_id')
      await assertRegisterManager(admin, userId, id)
      if (type === 'libretti_group' && !group_id) return jsonError(400, 'missing_group_id')
    } else {
      return jsonError(400, 'unknown_type')
    }

    // Build PDF
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const ctx: LayoutCtx = {
      doc, page: null as unknown as PDFPage, font, bold, y: 0, pageNo: 0,
      footerText: `${L[locale].appName}  ·  ${L[locale].generatedOn} ${fmtDateTime(new Date().toISOString(), locale)}`,
    }

    let filename = 'document.pdf'
    if (type === 'dive_log_single') {
      await renderDiveLogSingle(admin, ctx, id!, locale)
      filename = `dive-log-${id}.pdf`
    } else if (type === 'logbook_all') {
      await renderLogbookAll(admin, ctx, userId, locale)
      filename = `logbook.pdf`
    } else if (type === 'register_pack') {
      await renderRegisterPack(admin, ctx, id!)
      filename = `pacchetto-uscita-${id}.pdf`
    } else if (type === 'register_check') {
      await renderRegisterCheck(admin, ctx, id!)
      filename = `registro-verifica-${id}.pdf`
    } else if (type === 'libretti_all') {
      await renderLibretti(admin, ctx, id!, null)
      filename = `libretti-${id}.pdf`
    } else if (type === 'libretti_group') {
      await renderLibretti(admin, ctx, id!, group_id!)
      filename = `libretti-${id}-${group_id}.pdf`
    }

    drawFooters(ctx, locale)
    const bytes = await doc.save()

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = String((e as Error).message || e)
    if (msg === 'forbidden') return jsonError(403, 'forbidden')
    if (msg === 'not_found') return jsonError(404, 'not_found')
    console.error('generate-logbook-pdf error', msg)
    return jsonError(500, 'server_error', { detail: msg })
  }
})
