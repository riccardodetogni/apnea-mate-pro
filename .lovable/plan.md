

# Batch Session Creation (Multiple Dates)

## Summary

Add the ability for instructors and group owners to create multiple independent sessions at once by selecting multiple dates (via calendar or recurrence pattern), with per-date time editing. All other fields (title, spot, type, level, etc.) are shared.

## UX Flow

```text
CreateSession page:
┌──────────────────────────────────┐
│  [Single session] [Multiple ▼]  │  ← toggle (only for instructors/group owners)
│                                  │
│  Tab: [Pick dates] [Repeat]     │
│                                  │
│  ┌─ Calendar (multi-select) ──┐ │  OR  Recurrence config
│  │  April 2026                │ │       Day checkboxes: [Mon][Wed]
│  │  [5] [8] [12] selected     │ │       For: [4] weeks
│  └────────────────────────────┘ │       Starting: [2026-04-07]
│                                  │
│  Selected dates:                 │
│  📅 5 Apr  ⏰ [09:00]          │  ← editable time per date
│  📅 8 Apr  ⏰ [09:00]     [✕]  │
│  📅 12 Apr ⏰ [14:00]     [✕]  │
│                                  │
│  ... rest of form (shared) ...   │
│  [Create 3 sessions]             │
└──────────────────────────────────┘
```

## Changes

### 1. `src/pages/CreateSession.tsx`
- Add state: `multiMode` (boolean), `selectedDates` (array of `{date: string, time: string}`), `datePickerTab` ("pick" | "repeat")
- Add recurrence state: `repeatDays` (weekday booleans), `repeatWeeks` (number), `repeatStartDate`
- Show "Multiple dates" toggle only when user `isInstructor` OR is owner/admin of any group (check via `useMyGroups` + `useProfile`)
- When `multiMode`:
  - Replace single date/time inputs with tabbed UI (calendar multi-select or recurrence)
  - Show date list with per-row time editor and remove button
  - Default time for new dates = the single `form.time` value
- On submit: loop through `selectedDates`, insert one session per date (same title/spot/type/level/duration/participants/paid/group), add creator as participant if `creatorJoins`
- Toast: "X sessioni create!" with count
- Navigate to `/my-sessions` after batch creation

### 2. New: `src/components/sessions/BatchDatePicker.tsx`
- Props: `selectedDates`, `onDatesChange`, `defaultTime`
- Two tabs: "Pick dates" and "Repeat pattern"
- **Pick dates tab**: `Calendar` from shadcn with `mode="multiple"`, `disabled={(d) => d < today}`
- **Repeat tab**: weekday checkboxes, weeks count (1-12), start date picker → generates date list on change
- Below both tabs: summary list of selected dates with inline time `<Input type="time">` and remove button per row
- Sorted chronologically

### 3. `src/lib/i18n.ts`
- Add keys:
  - `singleSession` / `multipleDates`
  - `pickDates` / `repeatPattern`
  - `repeatEvery` / `forWeeks` / `sessionsCreated`
  - `removeDate`

### 4. Access control for toggle visibility
- `useProfile` already provides `isInstructor`
- For group owner check: use existing `useMyGroups` — if user has any groups, they qualify (group creators are always owners)
- The toggle simply shows/hides the multi-date UI; no DB or RLS changes needed since sessions are inserted individually with same existing RLS

### Technical details
- No database changes — each session is an independent row, inserted in a loop
- `react-day-picker` already supports `mode="multiple"` for multi-date selection
- Recurrence pattern generates dates client-side using simple date arithmetic
- Batch insert uses `Promise.all` with individual inserts (not bulk) to properly handle per-session creator participant inserts
- Calendar needs `pointer-events-auto` class per shadcn guidance

