

# Multiple Sessions Per Day + Repeat Template Pattern

## Two changes to BatchDatePicker

### 1. Multiple sessions per day (Pick dates mode)
- Change `SelectedDate` to include an `index` field: `{ date: string; time: string; index: number }` — allowing up to 3 entries with the same `date` but different `index` values
- In the selected dates list, add a **"+"** button on each date row to add another session on the same day (max 3 per day)
- Each same-day entry gets its own time input and remove button
- The `key` becomes `${sd.date}-${sd.index}` instead of just `sd.date`
- Calendar multi-select still toggles dates on/off; when a date is removed from calendar, all entries for that date are removed
- Count label shows total entries (e.g., "5 sessioni" even if only 3 unique dates)

### 2. Repeat mode: template pattern instead of full list
- Instead of showing all generated dates in the list, show only the **template rows** — one per selected weekday (e.g., "Lunedì" and "Martedì")
- Each template row can have a "+" to add additional time slots (up to 3), same as pick mode
- The generated dates are computed internally but not shown individually — the user customizes only the template
- All Mondays get Monday's time(s), all Tuesdays get Tuesday's time(s), etc.
- Below the template, show a summary: "6 sessioni verranno create (3 settimane × 2 giorni)"

### 3. CreateSession.tsx submission
- Update `datesToCreate` to handle multiple entries per date — flatten all `selectedDates` entries into individual `Date` objects for insertion
- Each entry = one independent session

### 4. i18n keys
- `addTimeSlot`: "Aggiungi orario" / "Add time slot"
- `maxTimeSlotsReached`: "Massimo 3 sessioni per giorno" / "Max 3 sessions per day"
- `sessionsWillBeCreated`: "sessioni verranno create" / "sessions will be created"

### Files to edit
- `src/components/sessions/BatchDatePicker.tsx` — main changes
- `src/pages/CreateSession.tsx` — adapt submission to new data shape
- `src/lib/i18n.ts` — new keys

