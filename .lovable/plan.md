## Goal

Make the "Vedi tutti / Vedi tutte" links on the Community page actually navigate somewhere useful. Currently 4 are broken (3 no-ops + "Sessions for you" pointing at the spots map).

## New list pages

Create four lightweight listing pages that reuse existing hooks + cards. Each page = `AppLayout` + back button + title + filter strip (where it already exists) + a single vertical scroll column of the same cards used on Community.

| Route | Page file | Data source | Card |
|---|---|---|---|
| `/sessions` | `src/pages/AllSessions.tsx` | `useSessions()` (existing — already powers "Sessions for you") | `SessionCard` |
| `/sessions/following` | `src/pages/FollowingSessions.tsx` | `useSessionsFromFollowing()` (existing) | `SessionCard` |
| `/events` | `src/pages/AllEvents.tsx` | `useEvents()` with no `groupId` (existing) | `EventCard` |
| `/courses` | `src/pages/AllCourses.tsx` | `useCourses()` with no `groupId` (existing) | `CourseCard` |

Each page:
- Header: back arrow → `navigate(-1)`, page title (`t("sessionsForYou")` / `t("fromPeopleYouFollow")` / `t("upcomingEvents")` / `t("availableCoursesSection")`).
- For `/sessions`: include the existing `SessionFilters` component (same as Community) so the full list is filterable. For `/sessions/following`: just the list (no filters, matches Community).
- Loading: 4 skeletons. Empty: same `EmptyCard` message used today on Community.
- Click handlers mirror Community: `SessionCard.onClick` → `/sessions/:id`, `EventCard.onClick` → `/events/:id`, `CourseCard.onClick` → `/courses/:id`. For `SessionCard` reuse `handleJoinSession` logic — to avoid duplicating the safety-modal flow, the simplest fix is: on these listing pages clicking a card just navigates to the session detail (which already has the inline join + safety modal). No join button on the list itself. This keeps each page small and avoids duplicating the safety-warning state machine.

## Wire the routes

`src/App.tsx` — add inside `RequireAuth`:
```
<Route path="/sessions" element={<RequireAuth><AllSessions /></RequireAuth>} />
<Route path="/sessions/following" element={<RequireAuth><FollowingSessions /></RequireAuth>} />
<Route path="/events" element={<RequireAuth><AllEvents /></RequireAuth>} />
<Route path="/courses" element={<RequireAuth><AllCourses /></RequireAuth>} />
```
(Pluralized, matches the routing convention.)

## Update Community.tsx

Replace the broken `onAction` props:

- "Sessions for you" → `navigate("/sessions")` (was `/spots`)
- "From people you follow" → `navigate("/sessions/following")` (was no-op)
- "Upcoming Events" → `navigate("/events")` (was no-op)
- "Available Courses" → `navigate("/courses")` (was no-op)

`Your groups` and `Groups near you` already point at `/groups` — leave them.

## Out of scope

- No new hooks, no DB migration, no schema change.
- No new translations needed (all titles already exist in `i18n.ts`).
- Listing pages intentionally skip the inline join+safety modal — users join from the detail page, which already supports it.

## Verification

1. From `/community`, every "Vedi tutti / Vedi tutte" navigates to a page that loads and shows the matching list.
2. Empty states render correctly when there's no data.
3. Back button returns to `/community`.
4. Existing Community page behavior is unchanged.