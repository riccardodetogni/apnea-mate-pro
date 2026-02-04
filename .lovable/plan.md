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

## 🔲 Remaining Work (Phase 5)

### Phase 5: Groups Polish
- [ ] Implement pending membership flow for `requires_approval` groups
  - Create `group_membership_requests` table or add `status` column to `group_members`
  - Show pending state to users
  - Admin UI to approve/reject requests
- [ ] Add verified badge logic in group cards
  - Differentiate "Verified club" / "Scuola partner" badges
- [ ] Optional: Group follow system (secondary action)

---

## Files Created

| File | Description |
|------|-------------|
| `src/pages/UserProfile.tsx` | Public user profile page |
| `src/pages/Search.tsx` | Global search with tabbed results |
| `src/hooks/useUserProfile.ts` | Fetch user profile + sessions created |
| `src/hooks/useFollow.ts` | Follow/unfollow users |

## Files Updated

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Added search_visibility toggle |
| `src/pages/CreateGroup.tsx` | Removed Focus tags section |
| `src/hooks/useProfile.ts` | Added search_visibility to Profile interface |
| `src/hooks/useSearch.ts` | Filter profiles by search_visibility |
| `src/App.tsx` | Added /users/:id and /search routes |
