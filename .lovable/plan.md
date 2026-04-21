

# Hide "Create event/course" CTAs from non-eligible users

## Problem
On the Community page, when the **Upcoming Events** or **Available Courses** sections are empty, the `EmptyCard` shows a "Create event" / "Create course" button to **every user** — even regular (non-certified) users without a verified group, who are not allowed to create events or courses.

The `Create` page (`/create`) already gates these options correctly using `useVerifiedGroups().canCreateEventsOrCourses || isAdmin`, but the Community empty-state cards bypass that check and link directly to `/create/event` and `/create/course`.

## Fix
In `src/pages/Community.tsx`:

1. Import `useVerifiedGroups` and `useProfile` (for `isAdmin`).
2. Compute `canCreateEventsOrCourses || isAdmin` once.
3. For the **Upcoming Events** empty state (lines ~494–500):
   - If user is eligible → keep current "Create event" CTA.
   - If not eligible → show `EmptyCard` with just the message (`noEvents`) and **no action button** (omit `actionLabel` / `onAction`).
4. Same treatment for the **Available Courses** empty state (lines ~525–531).

## Verify EmptyCard supports no-action mode
Quickly check `src/components/community/EmptyCard.tsx` to confirm `actionLabel`/`onAction` are optional. If they aren't, make them optional and render the button conditionally.

## Out of scope
- No changes to events/courses lists themselves.
- No changes to the `/create` page (already gated correctly).
- No backend / RLS changes — server-side creation is already restricted.

