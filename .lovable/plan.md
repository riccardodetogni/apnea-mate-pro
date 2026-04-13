

# Restrict Event & Course Creation to Verified Group Owners

## Current state
- RLS INSERT policies on `events` and `courses` allow creation by anyone with `instructor` or `admin` role, OR group owners (even of non-verified groups)
- UI shows event/course options to everyone in the Create page with no permission check
- No `group_id` is required when creating events/courses

## What changes

### 1. Database: new RPC function `is_verified_group_owner`
Create a security definer function that checks if a user owns/admins at least one verified group:
```sql
CREATE OR REPLACE FUNCTION public.is_verified_group_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    JOIN public.group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = _user_id
      AND gm.role IN ('owner', 'admin')
      AND gm.status = 'approved'
      AND g.verified = true
  )
$$;
```

### 2. Database: update RLS INSERT policies
Replace the current INSERT policies on `events` and `courses` to require verified group ownership:

**Events:**
```sql
DROP POLICY "Instructors and group owners can create events" ON public.events;
CREATE POLICY "Verified group owners can create events" ON public.events
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = creator_id
    AND group_id IS NOT NULL
    AND is_group_owner(auth.uid(), group_id)
    AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND verified = true)
  );
```

**Courses:** same pattern.

Also allow `admin` role users to bypass (they can always create):
```sql
OR has_role(auth.uid(), 'admin'::app_role)
```

### 3. Database: also add function to get user's verified groups
For the UI dropdown, create an RPC or just query groups where user is owner + verified.

### 4. UI: Create page — hide event/course if not verified group owner
- In `Create.tsx`, fetch whether user is a verified group owner (query `groups` joined with `group_members`)
- Hide the "event" and "course" options if not

### 5. UI: CreateEvent & CreateCourse — require group_id selection
- Add a mandatory group selector dropdown (only showing verified groups the user owns)
- `group_id` becomes required, not optional
- Remove the ability to create events/courses without a group

### 6. UI: hook for verified group ownership
Create a small hook `useVerifiedGroups()` that returns the list of verified groups the user owns/admins. Used by Create page (to show/hide options) and by CreateEvent/CreateCourse (for the group selector).

## Files to change
- **Migration**: new RPC + updated RLS policies on `events` and `courses`
- **`src/hooks/useMyGroups.ts`** (or new hook): add filter for verified groups where user is owner
- **`src/pages/Create.tsx`**: conditionally show event/course options
- **`src/pages/CreateEvent.tsx`**: add required group selector
- **`src/pages/CreateCourse.tsx`**: add required group selector

## Summary
Events and courses become group-bound content that only verified school owners can create. Admins retain full access. The UI hides options for non-eligible users and requires selecting a verified group.

