

# Fix: Group Card Button State After Join

## Problems Found

### 1. Community page: `handleJoinGroup` never calls `joinGroup()` for approval-required groups
Lines 127-134 in `Community.tsx` have a `TODO` early return — it shows a toast but never inserts the membership row.

### 2. Community page: `onJoin` always passed regardless of membership status
Line 435 passes `onJoin` to every group in "Groups near you", even if the user already joined or has a pending request. Compare with `Groups.tsx` line 127 which correctly checks `!group.isMember && !group.isPending`.

### 3. Community page: groups filtering doesn't account for pending state
Line 289 (`availableGroups = groups.filter(g => !g.isMember)`) excludes members but not pending users, so a pending group still shows in "Groups near you" with a join button.

## Fix

### `src/pages/Community.tsx`

1. **Fix `handleJoinGroup`** (lines 127-161): Remove the `requiresApproval` early return. Always call `joinGroup(group.id)`, then branch toast on `isPending` result — same pattern as `Groups.tsx`.

2. **Fix `onJoin` prop** (line 435): Only pass `onJoin` when `!group.isMember && !group.isPending`, matching the Groups page behavior.

3. **Fix `availableGroups` filter** (line 289): Change from `groups.filter(g => !g.isMember)` to `groups.filter(g => !g.isMember && !g.isPending)` so pending groups move to "Your groups" or at least don't show a join button.

### `src/components/community/GroupCard.tsx`
No changes needed — the card already correctly renders "Membro" / "In attesa" / join button based on the `isMember`, `isPending`, and `onJoin` props. The bug is in the parent pages not passing the right props.

