# Trip/Stage blank register template + remove duplicated outing fields

## 1. Trip/Stage events: blank Excel template

Multi-day outings (trip, stage) can't be represented by a single pre-filled register sheet, so the Excel export for these registers becomes an empty official "Registro delle immersioni" template to be completed by hand.

- The in-app register stays exactly as it is for trip/stage (participants, attendance, signatures) — nothing is removed.
- When the register belongs to a trip or stage event, the "Registro (Excel)" download produces the official template with:
  - the same header/table layout and column widths as today,
  - header values left blank (no title, date, times, depth, centre, responsibles),
  - an empty set of participant rows (about 25) ready to be filled in on paper or in Excel,
  - filename such as `registro-immersioni-template.xlsx`.
- Sessions and non-trip/stage registers keep the current pre-filled export unchanged.
- A short note next to the export button explains that for trips/stages the register must be filled in per day, one sheet per day.
- The "Libretti (Excel)" export is unchanged.

## 2. Register screen: remove duplicated fields

In the "Dati uscita (L. 70)" card at the top of the register screen:

- Remove the **end time** field (asked again at closure).
- Remove the **maximum/planned depth** field (asked again at closure).
- Keep **start time** and **centre name**, plus the save button.

End time and max depth are therefore captured only once, during register closure. Values already saved in the database are preserved and still used by the exports.

## Technical notes

- `supabase/functions/generate-logbook-xlsx/index.ts`: in the `register` branch, detect `dive_registers.event_id` joined to `events.event_type IN ('trip','stage')` and build a blank sheet variant (same builder, empty values, N empty rows) instead of the populated one.
- `src/pages/register/RegisterDetail.tsx`: drop `fEnd`/`fDepth` state, inputs and payload keys from the outing-fields card and `handleSaveOutingFields`; closure flow (`endTime`, `maxDepth`) untouched.
- Add/adjust i18n keys for the trip/stage export note; remove now-unused labels only if no longer referenced.
- No database migration required.
