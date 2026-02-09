

# Performance Optimization: React Query Caching + Lazy-Loaded Routes

## Overview

The app feels slow because every page navigation triggers full data re-fetches with loading spinners, and the entire app bundle loads upfront. This plan addresses both issues:

- **React Query migration**: Cache data so revisiting pages shows instant content (stale-while-revalidate pattern)
- **Lazy-loaded routes**: Split the bundle so only the current page loads, reducing initial load time

## What Changes for Users

- Navigating between pages will feel nearly instant -- previously loaded data appears immediately
- Background refreshes happen silently without spinners
- Initial app load is faster since only the current page code downloads
- The app will show a brief loading indicator only on the very first visit to each page

## Detailed Changes

### 1. Configure QueryClient with sensible defaults (`src/App.tsx`)

Set `staleTime: 2 * 60 * 1000` (2 minutes) and `gcTime: 10 * 60 * 1000` (10 minutes) so data is served from cache on navigation and silently refreshed in the background.

### 2. Lazy-load all page routes (`src/App.tsx`)

Replace all eager `import` statements with `React.lazy()` and wrap the routes in `<Suspense>` with a lightweight fallback spinner. Pages to lazy-load:

- Auth, ResetPassword, Onboarding
- Community, Spots, SpotDetails
- Create, CreateSession, CreateGroup
- SessionDetails, EditSession, MySessions
- Groups, GroupDetails, GroupManage
- Training, Profile, Settings
- UserProfile, Search, Admin
- DiscoverFreedivers, NotFound

### 3. Migrate `useSessions` to React Query (`src/hooks/useSessions.ts`)

- Replace `useState` + `useEffect` + `useCallback` with `useQuery`
- Query key: `["sessions", { excludeJoined, filterByFollowing, userId }]`
- Keep the fetch logic as-is but return data from `queryFn`
- Keep realtime subscription but call `queryClient.invalidateQueries` instead of manual refetch
- Keep `joinSession`/`leaveSession` as mutations using `useMutation` with optimistic or invalidation-based updates
- Remove manual `setLoading` / `setSessions` / `setError` state

### 4. Migrate `useGroups` to React Query (`src/hooks/useGroups.ts`)

- Query key: `["groups", userId]`
- Same pattern: `useQuery` for fetching, realtime invalidation, `useMutation` for join/leave
- Remove manual state management

### 5. Migrate `useMyParticipations` to React Query (`src/hooks/useMyParticipations.ts`)

- Query key: `["my-participations", userId]`
- Same pattern with realtime invalidation

### 6. Migrate `useProfile` to React Query (`src/hooks/useProfile.ts`)

- Query key: `["profile", userId]`
- Keep `updateProfile` and `submitCertification` as mutations that invalidate the profile query
- This is especially impactful since the profile is used by `useCommunityContext` which runs on the Community page

### 7. Migrate `useSpots` to React Query (`src/hooks/useSpots.ts`)

- Query key: `["spots"]`
- Simple migration -- no realtime needed

### 8. Migrate `useMyGroups` to React Query (`src/hooks/useMyGroups.ts`)

- Query key: `["my-groups", userId]`
- Simple migration

### 9. Migrate `useNotifications` to React Query (`src/hooks/useNotifications.ts`)

- Query key: `["notifications", userId]`
- Keep realtime subscription for INSERT/UPDATE but use `queryClient.setQueryData` for optimistic local updates
- Mutations for `markAsRead`, `markAllAsRead`, `deleteAll`

### 10. Remove redundant refetch-on-navigate in `Community.tsx`

Lines 80-102 have `visibilitychange` and `location.pathname` listeners that force full refetches. These are unnecessary with React Query's `refetchOnWindowFocus` (enabled by default) and stale-while-revalidate caching.

### 11. Keep `useSearch` as-is

Search is user-initiated (not cached between navigations), so it doesn't benefit from React Query migration. Leave it using local state.

### 12. Keep `useCommunityContext` as-is

This is a composition hook (combines auth + profile + location + filters). It already delegates to `useProfile` which will be cached via React Query. No direct changes needed.

## Technical Details

### React Query Pattern (applied to each hook)

```text
// Before (manual state)
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const fetchFn = useCallback(async () => {
  setLoading(true);
  const result = await supabase.from("table").select("*");
  setData(result.data);
  setLoading(false);
}, []);
useEffect(() => { fetchFn(); }, [fetchFn]);

// After (React Query)
const { data = [], isLoading } = useQuery({
  queryKey: ["table", userId],
  queryFn: async () => {
    const { data, error } = await supabase.from("table").select("*");
    if (error) throw error;
    return data;
  },
  enabled: !!userId,
});
```

### Realtime Integration Pattern

```text
useEffect(() => {
  const channel = supabase
    .channel("channel-name")
    .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [queryClient]);
```

### Lazy Loading Pattern

```text
const Community = lazy(() => import("./pages/Community"));
const Spots = lazy(() => import("./pages/Spots"));
// ... etc

<Suspense fallback={<PageSpinner />}>
  <Routes>
    <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
    ...
  </Routes>
</Suspense>
```

## Files to Modify

| File | Changes |
|---|---|
| `src/App.tsx` | QueryClient defaults, lazy imports, Suspense wrapper |
| `src/hooks/useSessions.ts` | Migrate to useQuery + useMutation + realtime invalidation |
| `src/hooks/useGroups.ts` | Migrate to useQuery + useMutation + realtime invalidation |
| `src/hooks/useMyParticipations.ts` | Migrate to useQuery + useMutation + realtime invalidation |
| `src/hooks/useProfile.ts` | Migrate to useQuery + useMutation |
| `src/hooks/useSpots.ts` | Migrate to useQuery |
| `src/hooks/useMyGroups.ts` | Migrate to useQuery |
| `src/hooks/useNotifications.ts` | Migrate to useQuery + useMutation + realtime setQueryData |
| `src/pages/Community.tsx` | Remove manual refetch-on-navigate logic (lines 80-102) |

## Scope

- No database or schema changes
- No visual/UI changes
- No new dependencies (React Query is already installed)
- All existing interfaces and return types remain the same for backward compatibility
- Realtime subscriptions are preserved

