# Lock instructor and centre on a dive log

## Problem

On the dive log detail page, the owner can freely edit the "Istruttore/guida" (and centre) text field. Those fields are the legal attribution of who supervised the dive: a diver can type any instructor's name, and the log then displays and prints (PDF/XLSX) a supervisor who never signed it. In the reported case the log said "Luca Ferrari", was edited to "Topo gigio", and then appeared signed as "Topo gigio".

Root cause: the fields are plain free-text inputs in the edit dialog and the database update policy allows the owner to update any column of their own log, so nothing stops the change.

## Fix

1. Remove the "Istruttore/guida" and "Centro" inputs from the dive log edit dialog. They stay visible in read-only display rows, filled from the register / signature.
2. Stop sending `instructor_label` and `center_label` in the update call, so an editing diver can never overwrite them.
3. Enforce the same rule in the database: a trigger on `dive_logs` rejects any change to `instructor_label` or `center_label` when the change comes from the log owner (register-sync triggers and signing functions run as security-definer and keep working).
4. Note for clarity in the dialog: instructor and centre come from the outing/register and can only be changed by the register manager.

## Technical notes

- `src/pages/DiveLogDetail.tsx`: drop `center_label` / `instructor_label` from the edit form state, dialog fields and `useUpdateDiveLog` payload.
- Migration: new `dive_logs_guard_attribution()` trigger (BEFORE UPDATE) raising an error when either label changes and the session user is the row owner rather than an elevated path.
- Existing PDF/XLSX exports and `VerificationBanner` keep reading `instructor_label` unchanged; only its mutation path is closed.

## Out of scope

Retroactively repairing already-tampered rows (e.g. the reported log). Can be done as a separate data fix if you want the original name restored.
