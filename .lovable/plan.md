

# Auto-select & auto-refresh new spot in Create Session

## Problem
When creating a new spot from inside the spot selector during session creation:
1. The new spot does not appear in the spot list (cached) — user must refresh the page to see it.
2. Even though the spot ID is technically set on the form, the selector button still shows "Seleziona uno spot" because the spot is missing from the local `spots` array — making the user click it again from the dropdown.

## Root cause
- `useSpots` (React Query, key `["spots"]`) caches the spots list. After `SpotCreator` inserts a new row into the `spots` table, nothing invalidates this query.
- `SpotSelector` displays the selected spot by looking it up in the cached `spots` array. If the newly created spot isn't in that array, the button falls back to the empty placeholder.
- In `CreateSession.tsx`, `SpotSelector`'s `onSpotCreated` prop is a no-op (`() => {}`), so no refresh is triggered.

## Fix

**1. `src/components/spots/SpotSelector.tsx`** — invalidate the spots query right after creation, so the parent form sees the new spot in the list:
- Import `useQueryClient` from `@tanstack/react-query`.
- In `handleSpotCreated`, before calling `onSelect(spotId)` and `onSpotCreated?.()`, call `queryClient.invalidateQueries({ queryKey: ["spots"] })` and `await` it (or use `refetchQueries`) so the new spot is loaded into the cache before the selector re-renders.
- This guarantees the selector immediately renders the new spot's name + location in its trigger button (no "phantom" empty state).

**2. `src/pages/CreateSession.tsx`** — no functional changes needed; once the cache is refreshed and `form.spot_id` is already set by `onSelect`, the selector will display correctly. The empty `onSpotCreated={() => {}}` can stay or be removed (kept for backward-compat).

**3. Apply the same fix to other forms using `SpotSelector`** for consistency:
- `src/pages/EditSession.tsx` (verify it uses SpotSelector and apply same flow if needed).

Since the fix lives in `SpotSelector` itself, all consumers (CreateSession, EditSession, and any future ones) benefit automatically — no per-page changes required.

## Out of scope
- No DB / RLS changes (insertion already works).
- No realtime subscription on spots — invalidation on the creating client is sufficient for this UX.
- No changes to `SpotCreator`'s internal logic.

