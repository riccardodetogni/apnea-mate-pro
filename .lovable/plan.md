# V1 Implementation Status

## ✅ Completed (Phase 1-3)

### Database Changes
- ✅ Added `search_visibility` boolean column to `profiles` table (default: true)
- ✅ Added `verified` boolean column to `groups` table (admin-only, default: false)
- ✅ Added index on `search_visibility` for efficient filtering

### Privacy Foundation
- ✅ Profile page includes search visibility toggle in settings
- ✅ Global search filters profiles by `search_visibility = true`

### User Profiles & Following
- ✅ Created public user profile page at `/users/:id`
- ✅ Created `useFollow` hook for follow/unfollow functionality
- ✅ Created `useUserProfile` hook for fetching user data + sessions
- ✅ Follow button on user profiles
- ✅ Shows sessions CREATED by user (not participated)
- ✅ Shows shared groups with current user
- ✅ Hidden profiles show "not public" message

### Global Search
- ✅ Created `/search` page with tabbed results
- ✅ Tabs: Persone / Gruppi / Sessioni / Spot
- ✅ People result cards include:
  - Avatar, name, coarse location
  - Certified badge
  - Preview row: next public session OR shared group
  - Actions: "Segui" + "Vai al profilo"
- ✅ Filters people by `search_visibility = true`

### Groups Polish
- ✅ Removed "Focus del gruppo" from Create Group form
- ✅ Added helper text for school/club type about partner verification

---

## ✅ Completed (Phase 4)

### Session Visibility
- ✅ Created `is_group_member()` security definer function
- ✅ Updated RLS policy: sessions with `group_id` AND `is_public=false` visible only to group members
- ✅ Added "Visibile solo ai membri del gruppo" toggle in session creation form

---

## ✅ Completed (Phase 5)

### Groups Polish
- ✅ Added `status` column to `group_members` (pending/approved/rejected)
- ✅ Created `is_group_owner()` security definer function
- ✅ Updated RLS policies for pending membership and owner management
- ✅ Group owners can approve/reject pending members
- ✅ Group owners can promote members to owner/admin roles
- ✅ Group owners can remove members
- ✅ Created `/groups/:id/manage` page for member management
- ✅ Verified badge differentiation: "Verified club" vs "Scuola partner"
- ✅ Pending state shown in group cards and detail pages

---

## Files Created

| File | Description |
|------|-------------|
| `src/pages/UserProfile.tsx` | Public user profile page |
| `src/pages/Search.tsx` | Global search with tabbed results |
| `src/pages/GroupManage.tsx` | Group member management for owners |
| `src/hooks/useUserProfile.ts` | Fetch user profile + sessions created |
| `src/hooks/useFollow.ts` | Follow/unfollow users |

## Files Updated

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Added search_visibility toggle |
| `src/pages/CreateGroup.tsx` | Removed Focus tags section |
| `src/pages/Groups.tsx` | Added isPending, isVerified, groupType props |
| `src/pages/GroupDetails.tsx` | Pending state, owner management link |
| `src/hooks/useProfile.ts` | Added search_visibility to Profile interface |
| `src/hooks/useSearch.ts` | Filter profiles by search_visibility |
| `src/hooks/useGroups.ts` | Added isPending, isVerified, status handling |
| `src/hooks/useGroupDetails.ts` | Added owner/pending management functions |
| `src/components/community/GroupCard.tsx` | Verified badge differentiation, pending state |
| `src/App.tsx` | Added /users/:id, /search, /groups/:id/manage routes |
