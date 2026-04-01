

# Session Calendar View — MySessions + GroupDetails

## Summary

Add a month-view calendar with colored dots on days that have sessions. Tapping a day shows the session list below. Two placements: MySessions (personal + available sessions) and GroupDetails (group sessions only).

## Changes

### 1. New: `src/components/sessions/SessionCalendar.tsx`
- Accepts `sessions` array: `{ id, title, date_time, status: "confirmed" | "pending" | "created" | "available", spotName?: string, sessionType?: string }`
- Uses the existing `Calendar` component in `mode="single"` for day selection
- Groups sessions by date string, renders colored dots under days via custom `modifiers` + CSS classes:
  - Blue = confirmed, Orange = pending, Purple = created by you, Gray = available
- Below calendar: list of sessions for selected day as clickable cards navigating to `/sessions/:id`
- `disabled` past dates, default selected day = today
- Props: `sessions`, `onSessionClick`, optional `singleColor` (for GroupDetails)

### 2. `src/pages/MySessions.tsx`
- Add `viewMode` state: `"list" | "calendar"`, default `"list"`
- Add toggle icons in header (`List`, `CalendarDays` from lucide)
- When `"calendar"`:
  - Map `useMyParticipations()` data into calendar session format (confirmed/pending/created statuses)
  - Also fetch available sessions via `useSessions({ excludeJoined: true })` and merge as `"available"` status
  - Render `<SessionCalendar>` instead of the list sections

### 3. `src/pages/GroupDetails.tsx`
- Add `sessionsView` state: `"list" | "calendar"`
- Add toggle icons above sessions section header
- When `"calendar"`: map group `sessions` into calendar format, render `<SessionCalendar singleColor>`

### 4. `src/index.css`
- Add CSS for calendar dot indicators using `::after` pseudo-elements on modifier classes:
  ```css
  .rdp-day--session-confirmed::after { /* blue dot */ }
  .rdp-day--session-pending::after { /* orange dot */ }
  .rdp-day--session-created::after { /* purple dot */ }
  .rdp-day--session-available::after { /* gray dot */ }
  ```
- Multiple dots side-by-side when a day has multiple status types

### 5. `src/lib/i18n.ts`
- Add keys: `calendarView`, `listView`, `noSessionsOnDate`, `availableSessions`

### Technical notes
- No database changes — all data from existing hooks
- DayPicker `modifiers` maps `Date[]` to named modifiers; `modifiersClassNames` maps to CSS classes
- `pointer-events-auto` added per shadcn guidance
- Past dates grayed out but still selectable to see past sessions

