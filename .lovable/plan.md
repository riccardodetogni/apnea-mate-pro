## Findings

I checked the 'Vicino a te' filter and found two real issues:

**1. Sessions without coordinates bypass the filter.**
In `useCommunityContext.ts` (`isWithinRadius`):
```ts
if (!filters.nearbyOnly) return true;
if (!location || !itemLat || !itemLon) return true; // ← shows the item
```
When `nearbyOnly` is ON but a session/spot has no lat/lon, the function returns `true`, so those sessions still appear. The user toggles "near me" expecting only nearby results and gets locationless ones too.

**2. The filter only runs on the Community page.**
The "Vicino a te" chip lives in `SearchBar`, which is only rendered on `/community`. The new list pages (`/sessions`, `/sessions/following`) — and Events/Courses — do not apply the radius filter at all, even though they share the same session pool. So a user filtering on Community, then tapping "Vedi tutte", loses the filter silently.

**3. (Confirmed working)** The 100 km radius change itself is wired up: `DEFAULT_RADIUS_KM = 100`, persisted under `apnea-mate-community-filters-v3`, applied via `withDistance.filter(s => isWithinRadius(s.lat, s.lon))` in Community.tsx. Distances use the Haversine formula on `spot.latitude/longitude` from the sessions query.

## Proposed Fix

**Fix #1 (bug):** In `isWithinRadius`, when `nearbyOnly` is true and the item has no coordinates, return `false` (exclude) instead of `true`. Sessions without a known location should not pass a "near me" filter.

**Fix #2 (scope):** Apply the same radius filter to `AllSessions.tsx` and `FollowingSessions.tsx` by:
- Using `useCommunityContext()` to read `filters.nearbyOnly`, `isWithinRadius`, and `getDistanceKm`.
- Mapping each session to its raw spot lat/lon (same pattern as Community.tsx).
- Filtering with `isWithinRadius` when `nearbyOnly` is true.
- The chip toggle stays on Community; these list pages just respect the persisted setting (no new UI needed). Optionally we can add a small badge "Filtro Vicino a te attivo" with a clear button — let me know if you want that.

**Not changing:** Events and Courses pages. They use a separate data shape and are not session-based; leaving them out unless you want the same filter there.

## Verification steps after fix

1. Open Community with nearbyOnly off → see all sessions including ones >100 km away.
2. Toggle "Vicino a te" → sessions >100 km and sessions with no spot location disappear.
3. Tap "Vedi tutte" → AllSessions shows the same filtered set.
4. Toggle off → all sessions reappear on both pages.