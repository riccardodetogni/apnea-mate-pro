## Root cause

The message still says "100 km" because the radius value is read from `localStorage["apnea-mate-community-filters-v4"]`, which was written while the default was still 100 km (during the previous fix step). When the default was bumped to 150 the storage key was left at `v4`, so any user who had already opened the app keeps the stale `{ radiusKm: 100 }` value forever. Fresh installs correctly get 150.

The rest of the flow is wired correctly:

- `DEFAULT_RADIUS_KM = 150` in `src/hooks/useCommunityContext.ts`
- `isWithinRadius` uses `filters.radiusKm` (not a hardcoded value)
- `Community.tsx`, `AllSessions.tsx`, `FollowingSessions.tsx` all render `{filters.radiusKm}` dynamically
- i18n string `noSessionNearby` uses `{radius}` placeholder, replaced with `filters.radiusKm`
- No hardcoded `100` anywhere in the radius flow (the only `100km` reference is an unrelated comment in `useDiscoverFreedivers.ts`)

## Fix

1. In `src/hooks/useCommunityContext.ts`:
   - Bump `FILTERS_STORAGE_KEY` from `"apnea-mate-community-filters-v4"` to `"apnea-mate-community-filters-v5"` so existing users pick up the new 150 km default.
   - Harden the loader so a saved `radiusKm` that doesn't match the current default still gets refreshed for users on the old key: when parsing saved filters, if `radiusKm` is missing or not a number, fall back to `DEFAULT_RADIUS_KM`. (Keeps user's `nearbyOnly` toggle state.)

That's the only change needed — every consumer already reads `filters.radiusKm` reactively, so the message, chips and filtering logic will all switch to 150 km together.

## Verification

1. Hard-reload `/community` with "Vicino a te" enabled → empty-state message reads "Nessuna sessione entro 150km…".
2. The "Vicino a te · 150 km ✕" chip on `/sessions` and `/sessions/following` shows 150.
3. Toggle the chip off then on → still 150, persisted across reloads under the `v5` key.
4. `grep` confirms no remaining hardcoded `100` in the radius flow.