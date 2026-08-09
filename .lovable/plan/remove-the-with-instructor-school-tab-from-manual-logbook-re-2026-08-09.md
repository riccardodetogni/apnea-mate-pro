# Remove the "With instructor / school" tab from manual logbook records

## Why

A manually created record has no field for instructor or school — those inputs were removed (and the database now blocks changing them) so nobody can type an attribution that never happened. So choosing "With instructor / school" today produces a record that claims to be a guided outing but shows "—" for instructor and centre. The tab is confusing and adds nothing.

Attribution should only ever come from two trusted paths: a register created from a session/event, or an instructor actually signing the entry.

## What changes

1. The create form loses the two tabs. It becomes a single "personal record" form with a short note explaining that a manual entry is a personal diary entry and that instructor/school appear only once an instructor signs it.
2. Every manually created record is saved as a free (personal) outing.
3. "Request signature" stays available on manual records: the diver can ask an instructor to sign, and after signing the entry shows the verified state with the signer's name and credential.
4. On the record detail page, the instructor/centre block is shown when there is something real to show — an attribution inherited from a register, or a signature — instead of being tied to the outing type.

Records already saved as guided keep working exactly as they do now; nothing is migrated or rewritten.

## Technical notes

- `src/pages/CreateDiveLog.tsx`: remove the `Tabs`/`outingType` state, always send `outing_type: "free"`, replace the two hint texts with one note.
- `src/pages/DiveLogDetail.tsx`: change the centre/instructor section condition from `outing_type === "guided"` to "has `instructor_label` or `center_label` or is signed". Leave the autofirma condition working for guided/self-managed logs as today.
- `src/lib/i18n.ts`: add the new single note key (IT/EN); leave `cdlTabGuided`/`cdlTabFree`/hints in place or remove once unused.
- No database change, no change to register-generated logs, signing RPCs, or exports.
