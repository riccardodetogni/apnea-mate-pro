# Legge 70 — compliance audit vs. the "Dettaglio Azioni / Regole / Campi" document

## 1. Compliance report

### Already compliant

| Rule | Status |
|---|---|
| R-012 Piscina → no register | Register creation skips spots with environment `pool` |
| R-015 / R-024 Mare & Lago → register with accepted people | Register auto-created on session insert (instructor/admin creators), participants synced on join/approval |
| R-016 / R-025 Unregistered participants | "Aggiungi ospite" with name, birthplace, birthdate, brevetto |
| R-018 / R-027 Present | Attendance pill on each participant |
| R-019 / R-028 Absent | Attendance pill supports `absent` (plus an extra `not_participating`) |
| R-020 / R-029 Single signature | Per-row "Firma" action |
| R-021 / R-030 Mass signature, present only | `sign_participants` signs only `attendance_status = 'present'` |
| R-022 / R-031 Reminder at event + X | `notify-missing-signatures` runs at register date + 3 days |
| R-034 Register hidden from non-instructors | All `/registro/*` routes wrapped in `RequireStaff` |
| Registro: date, start time, brevetto, instructor, end time, max depth | Date/start from session, end time and max depth captured at closure, brevetto resolved from profile/certification |
| R-033 Logbook vs. instructors | Confirmed as "instructors cannot see other students' logbooks" — already true (`can_view_dive_log`) |

### Not compliant — to be fixed

1. **R-013 / R-014 — Piscina Profonda and Pesca still create a register.** The skip rule only covers `pool`; `deep_pool` spots and `spearfishing` sessions currently get a register.
2. **R-002 / R-007 — Events of type Trip and Stage create no register at all.** There is no trigger on `events`; registers exist only for sessions.
3. **R-003 / R-008 — Excel template export missing.** Only PDF export exists.
4. **R-004 / R-009 — Phase 2 upload of the filled register.** Out of scope now, but no storage/data model prepared.
5. **R-005 / R-006 — Student-created Logbook entry for an event + signature-request notification to the instructor.** Students can create a manual dive log, but there is no "request signature" that notifies an instructor — the only flow is scanning the instructor's QR in person, and no notification is ever sent.
6. **R-001 — Gara/competition.** Correct by accident (no event registers at all); must stay correct once R-002 is implemented.
7. **R-017 / R-026 — Signing allowed too early.** Both signing RPCs only check `register_date <= current_date`, so signing unlocks at 00:00 on the day. Must respect the session start time.
8. **Register participant selection.** The register is populated with `pending` and `confirmed` participants; the document says "persone accettate all'uscita" (accepted only).
9. **Field mapping (page 3).** The register header still asks for *fine* (end) and *profondità* up top; the document requires those to be collected only at closure.
10. **Logbook defaults.** "Tipo di autorespiratore = Nessuno" and "Miscela = Nessuna" are shown as a static conformity note, not as actual per-log fields; for events, Località must come from the event city/region and Centro/Istruttore from the event's group.

## 2. Implementation plan

### Step 1 — No-register cases (R-013, R-014)
Update `ensure_register_for_session` to also return early when the spot environment is `deep_pool` or the session type is `spearfishing`. Delete registers already created for those types that have no signatures.

### Step 2 — Signature timing (R-017, R-026)
Change the guard in `sign_participants` and `sign_libretti_group` from `register_date <= current_date` to a full timestamp check against `register_date + start_time` (Europe/Rome). Reflect the same rule in the register UI so the sign buttons stay disabled with an explanatory hint until the start time. Reminder stays at +3 days.

### Step 3 — Register for Trip / Stage events (R-002, R-007, R-001)
Add an `event_id` column to `dive_registers` and a trigger on `events` that creates a register for `event_type IN ('trip','stage')` only — never for `competition`. Date/location come from the event (start date, city/region), centre and instructor from the event's group. Register list and detail show event-based registers alongside session ones.

### Step 4 — Excel template export (R-003, R-008)
Two official templates received, both titled "ai sensi della Legge 70/2006":

- **Registro delle immersioni** — columns: data | orario immersione (inizio, fine) | partecipanti | brevetto posseduto | istruttore | profondità massima raggiunta | autorespiratore e miscela. 28 blank rows.
- **Libretto delle immersioni** — header block with "Cognome e nome" and "brevetto posseduto", then columns: data | località | sessione di immersione in APNEA (orario inizio, orario fine) | tipo di autorespiratore | miscela utilizzata | profondità massima (programmata, raggiunta) | denominazione del centro di immersione | istruttore | firma istruttore.

Implementation: an "Esporta Excel" action generating `.xlsx` files that reproduce these layouts exactly (merged header cells, titles, column widths, borders, blank rows). Two variants of the libretto — with and without the "firma istruttore" column — for the digitally-signed case where the app signature replaces the handwritten one.

Scope: the Registro template is exported for Trip/Stage event registers (blank, for on-paper completion) and also for Mare/Lago registers as an alternative to the current PDF. The Libretto template becomes an Excel export option next to the existing PDF logbook export. For Trip/Stage registers, in-app signing is not offered in Phase 1 — the register is the exported paper form.


### Step 5 — Student signature request with notification (R-005, R-006)
Add a `signature_request` notification type. From a dive log with no signature, the student picks the instructor (session/event organiser, or a searchable instructor) and sends a request; the instructor receives an in-app notification plus email, opens the log and signs it with re-auth. Keeps the existing QR flow as the in-person alternative.

### Step 6 — Accepted participants only (mapping page 1)
Restrict register population to `confirmed` participants in `ensure_register_for_session` and `sync_confirmed_to_register`; a participant later approved is added at approval time (already the case). Pending people are no longer pre-loaded into the legal record.

### Step 7 — Field mapping cleanup (page 3)
Remove end time and depth from the register's top "outing data" card; keep them exclusively in the closure form. Add explicit `breathing_apparatus` / `gas_mix` values to dive logs defaulting to "Nessuno" / "Nessuna" and print them from the stored values instead of a static note. For event-based logs, fill Località from the event location and Centro/Istruttore from the event's group.

### Step 8 — Phase 2 placeholder (R-004, R-009)
Not built now. Noted as: a private storage bucket plus an `attachment_url` on the register, gated to the register manager.

## Technical notes

- All schema work goes into new `<timestamp>_name.sql` migrations; existing migration files are not renamed.
- New columns: `dive_registers.event_id`, `dive_logs.breathing_apparatus`, `dive_logs.gas_mix`.
- New notification enum value `signature_request`, plus a transactional email template following the existing `_shared/transactional-email-templates` pattern.
- Excel generation runs server-side alongside the existing `generate-logbook-pdf` function so the output stays auditable, using a small `.xlsx` writer (no LibreOffice in the edge runtime).
- Steps 1, 2, 6 and 7 are small and low-risk and can ship first; steps 3–5 are the substantial new work.

## Note

Both templates cite "Legge 70/2006", while the app's UI text refers to "L. 70/2026". Worth confirming which is correct so the wording is consistent everywhere.

