

# Fix group membership UI not updating after join/leave

## Problem
After joining or leaving a group, the UI doesn't reflect the change until manual page reload. The `joinGroup` and `leaveGroup` functions in `useGroups.ts` insert/delete from the database but don't invalidate the React Query cache afterward. The realtime subscription exists but can be delayed.

## Solution
Add `queryClient.invalidateQueries` calls after successful join/leave operations in `useGroups.ts`. Same fix needed in `useGroupDetails.ts` (already does `fetchGroupDetails()` — looks fine there).

### `src/hooks/useGroups.ts`
- After successful `joinGroup` (no error): call `queryClient.invalidateQueries({ queryKey: ["groups"] })`
- After successful `leaveGroup` (no error): call `queryClient.invalidateQueries({ queryKey: ["groups"] })`
- This ensures the groups list immediately re-fetches with updated membership status

Single-file, two-line fix.

