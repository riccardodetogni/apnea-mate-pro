## Goal

Add proper filtering to the four new list pages (`/sessions`, `/sessions/following`, `/events`, `/courses`) so they behave like the Community sections, not just dumped lists.

## Sessions pages (`/sessions` and `/sessions/following`)

Reuse the existing `SessionFilters` component and the `applySessionFilters` logic already used in `Community.tsx`. The cleanest way is to extract that filter logic into a small shared helper instead of duplicating it across 3 places.

1. New file `src/lib/sessionFilters.ts`
   - Export `applySessionFilters(sessions, filters)` — pure function copied verbatim from `Community.tsx` (date range incl. custom, spot, paid/free).
   - Move imports of `date-fns` (`startOfDay`, `endOfDay`, `addDays`, `startOfWeek`, `endOfWeek`, `addWeeks`, `isWithinInterval`) here.

2. `src/pages/Community.tsx`
   - Replace the inline `applySessionFilters` with the imported helper. No behavior change.

3. `src/pages/AllSessions.tsx`
   - Add `useState<SessionFilterState>(defaultSessionFilters)`.
   - Render `<SessionFilters sessions={sessions} filters={...} onFiltersChange={...} />` directly under the page header.
   - Pass `applySessionFilters(sessions, filters)` to the list render.
   - Keep the existing empty state.

4. `src/pages/FollowingSessions.tsx` — same treatment as `AllSessions.tsx`.

## Events & Courses pages (`/events`, `/courses`)

There is no existing filter component for events/courses. Add a small, focused date-range chip filter — it covers ~90% of real-world use without overengineering.

5. New file `src/components/community/DateRangeChips.tsx`
   - Renders a horizontal chip row identical in style to the date chips inside `SessionFilters`.
   - Options: `all`, `today`, `thisWeek`, `thisMonth`, `nextMonth` (labels via `t()` — `all`, `today`, `thisWeek` already exist; add `thisMonth` + `nextMonth` to `src/lib/i18n.ts` IT + EN).
   - Props: `value`, `onChange`.

6. `src/pages/AllEvents.tsx` and `src/pages/AllCourses.tsx`
   - Add `useState<DateRange>("all")` and render `<DateRangeChips />` under the header.
   - Filter the list by `start_date` against the chosen range using `date-fns` (`startOfDay`, `endOfDay`, `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth`, `addMonths`, `isWithinInterval`).
   - Show the existing empty state when the filtered list is empty.

## Out of scope

- No new hooks, no DB changes.
- No new filter dimensions on events/courses beyond date range (price/location etc. can come later if asked).
- Spot filter inside `SessionFilters` keeps working as-is on the new sessions pages — `SessionFilters` derives the spot dropdown from the sessions you pass it.

## Verification

1. `/sessions` and `/sessions/following`: date chips, spot picker, and paid/free filters all visibly narrow the list.
2. `/events` and `/courses`: date-range chips narrow the list to events/courses whose `start_date` falls in the selected window.
3. Community page still works exactly as before (no regression from extracting the helper).
4. Empty states still show with the right "create" CTA when filters yield zero results.