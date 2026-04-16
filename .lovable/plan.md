

# Redesign Spot filters: Activity, Level, Date

## Overview
Replace the current spot filters (water type, depth, access, safety, amenities) with three session-based filters: **Activity** (session type), **Level**, and **Date**. Spots will be shown only if they have upcoming sessions matching the selected filters.

## Data flow
The current approach filters spots by `environment_type` (a spot property). The new approach filters spots by their **associated sessions**. This requires fetching sessions data alongside spots.

```text
User selects filters → filter sessions by activity/level/date
                      → get set of spot_ids from matching sessions
                      → show only those spots on the map
                      (if no filters active → show all spots)
```

## Changes

### 1. `src/hooks/useSpots.ts` — Fetch sessions with spot data
- Already fetches active sessions to mark `hasActiveSessions`
- Expand session fetch to include `session_type`, `level`, `date_time` fields
- Return sessions grouped by `spot_id` so filtering can happen client-side
- New return: `spotSessions: Record<string, { session_type: string; level: string; date_time: string }[]>`

### 2. `src/components/spots/SpotFiltersSheet.tsx` — Replace filter sections
- Remove: waterTypes, depthRanges, accessTypes, safetyFeatures, amenities
- Add three filter sections:
  - **Attività**: chips for `sea_trip`, `pool_session`, `deep_pool_session`, `lake_trip`, `spearfishing` (using existing `getSessionTypes()`)
  - **Livello**: chips for `all_levels`, `beginner`, `intermediate`, `advanced` (using existing `getLevels()`)
  - **Data**: date picker (from/to) using Calendar popover, plus quick chips (Oggi, Domani, Questa settimana)
- Update filter interface to `{ activities: string[]; levels: string[]; dateFrom?: string; dateTo?: string }`

### 3. `src/pages/Spots.tsx` — Update filter logic and quick filter chips
- Replace `initialFilters` shape to match new `{ activities, levels, dateFrom, dateTo }`
- Update quick filter chips: keep `All`, `Favorites`; replace water-type chips with activity chips (`Mare`, `Piscina`, `Pesca sub.`)
- In `filteredSpots` memo: when activity/level/date filters are active, filter spots by checking if any of their sessions match all active criteria
- Pass `spotSessions` from `useSpots` into the filtering logic

### 4. `src/lib/i18n.ts` — Add missing translation keys
- Add Italian/English keys for: `filterSpearfishing`, `filterDate`, `filterLevel`, `filterActivity`, `dateFrom`, `dateTo`, `today`, `tomorrow`, `thisWeek`

## Technical notes
- The `spearfishing` session type already exists in `getSessionTypes()`
- Sessions data is already partially fetched in `useSpots` — just needs more fields
- Date filtering compares `date_time` against selected range
- When no filters are active, all spots are shown (current behavior preserved)

