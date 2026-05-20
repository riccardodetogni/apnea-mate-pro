# Allow instructors to create Events and Courses

## Goal
Any user with role `instructor` (or `admin`) can create Events and Courses. Attaching to a group becomes optional; the verified-group requirement is dropped.

## Changes

### 1. Frontend gating — `src/pages/Create.tsx`
Replace `canCreateEventsOrCourses || isAdmin` with `isInstructor || isAdmin` (use `useProfile`). Drop the `useVerifiedGroups` import here.

### 2. Create forms — `src/pages/CreateEvent.tsx` and `src/pages/CreateCourse.tsx`
- Replace the verified-groups selector with an **optional** group picker that lists all groups the user owns/admins (verified or not). Add a "Nessun gruppo" option (default).
- Submit `group_id: form.group_id || null`.
- Remove `!form.group_id` from validation and the submit button's `disabled`.
- Keep the auto-select-if-only-one behavior, but only as a convenience (still overridable).

### 3. RLS policy updates (migration)
Replace the INSERT policies on `events` and `courses` so they allow:
- `admin`, OR
- `instructor` creating a row with `creator_id = auth.uid()`, with `group_id` either NULL or a group they own/admin (no `verified` requirement).

Old policy required `is_group_owner` AND `groups.verified = true`.

### 4. Memory updates
- Update `mem://features/events-and-courses` — new rule: instructors/admins can create; group optional; no verified-group gate.
- Update `mem://features/group-verification-and-partner-status` — verification is now a badge/trust signal only, not a gate for Events/Courses.
- Update the Core index entry accordingly.

## Out of scope
- No changes to Sessions (already instructor-allowed).
- No changes to the verification request flow (the button stays so schools can still get the verified badge).
- No changes to chat behavior; standalone Events/Courses (no group) simply won't have a group-chat link.

## Technical notes
- Migration drops & recreates `Verified group owners can create events` and `Verified group owners can create courses` policies.
- New policy uses `has_role(auth.uid(), 'instructor')` / `'admin'` and `is_group_owner(auth.uid(), group_id)` only when `group_id IS NOT NULL`.
