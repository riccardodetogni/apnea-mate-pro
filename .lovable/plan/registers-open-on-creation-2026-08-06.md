# Registers open on creation

Today every dive register is born as "Da aprire" and the instructor has to tap "Apri registro" before anything else. That extra step adds no information (the opening time is just the planned start of the outing) and it leaves stale registers: one register whose date has already passed is still sitting in "Da aprire". We remove the state from the flow.

## New behaviour

- A register is created directly as **Aperto**, with the opening time set to the outing's scheduled start (date + start time; falls back to the creation time when no start time is set).
- This applies to all three creation paths: automatic creation from a session, automatic creation from a trip/stage event, and manual creation by staff.
- Existing registers still in "Da aprire" are moved to "Aperto" with the same opening-time rule, so nothing stays stuck.
- The "Apri registro" button and the whole "Da aprire" section disappear from the register screen. Instructors land straight on the open register: participants, group assignment, exports, and the closure form.
- Closing keeps working exactly as today, including the immutability rules once a register is "Chiuso".

## Technical notes

Database migration:
- Update `ensure_register_for_session`, `ensure_register_for_event`, and the default on `dive_registers.status` to insert `'aperto'` with `opened_at` derived from `register_date + start_time` (Europe/Rome), falling back to `now()`.
- One-off data update: existing `status = 'da_aprire'` rows to `'aperto'` with the same `opened_at` rule.
- Keep `'da_aprire'` in the status check constraint (harmless, avoids breaking historical rows and the existing state-machine trigger).

Frontend:
- `src/pages/register/RegisterDetail.tsx`: remove the `status === "da_aprire"` block and the `handleOpen` call site.
- `src/hooks/useDiveRegisters.ts`: manual creation inserts `status: "aperto"`; drop the now-unused `openRegister` mutation.
- `src/components/register/StatusBadge.tsx` and the `stDaAprire` / `rdOpen` / `rdOpened` i18n keys stay in place only if still referenced; otherwise they are removed.
