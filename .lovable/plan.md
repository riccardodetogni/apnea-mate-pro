
# V1 Gap Analysis - What's Done vs. What's Missing

Based on the Core Product Rules and the codebase analysis, here is a detailed breakdown:

---

## 1) People/Buddy System

| Requirement | Status | Notes |
|-------------|--------|-------|
| Users can FOLLOW other users | Partial | `follows` table exists with RLS, but no UI to follow users |
| NO friends list by city | OK | Not implemented (correct) |
| People discovered via global search | Partial | Search exists but returns all profiles (no visibility filter) |
| `search_visibility` flag | Missing | Column does NOT exist in `profiles` table |
| Public user profile page (`/profile/:userId`) | Missing | Only self-profile exists (`/profile`) |
| Show only sessions CREATED by user on profile | Missing | No implementation |

**Missing Work:**
- Add `search_visibility` boolean column to `profiles` table
- Create public user profile page at `/users/:id` or `/profile/:id`
- Add Follow button on user profiles
- Filter profile search by `search_visibility = true`
- Show sessions created by user on their public profile

---

## 2) Groups

| Requirement | Status | Notes |
|-------------|--------|-------|
| Groups represent ALL communities | Done | Both spontaneous + schools use same table |
| Users JOIN groups | Done | `group_members` table, join logic works |
| Users FOLLOW groups (secondary) | Missing | No group follows implementation |
| Verified badge for schools/clubs | Partial | UI shows instructor badge, but no `verified` column |
| Partner schools are admin-created | Missing | No backend flag `verified=true` on groups |
| UI differentiates badges | Partial | Shows instructor-led, but not "Verified club" / "Scuola partner" |
| Group creation is for spontaneous groups | Done | Any user can create |
| Request-to-join for approval groups | Partial | `requires_approval` exists, but no pending membership flow |

**Missing Work:**
- Add `verified` boolean column to `groups` table (admin-only)
- Remove "Focus del gruppo" from create form per requirements
- Implement pending membership for `requires_approval` groups
- Optional: Group follow system (secondary action)

---

## 3) Sessions

| Requirement | Status | Notes |
|-------------|--------|-------|
| Any user can create session | Partial | Only certified/instructor can create (RLS policy) |
| Session privacy: PUBLIC or GROUP-ONLY | Partial | `is_public` exists but no GROUP-ONLY visibility logic |
| Sessions linked to groups | Done | `group_id` column exists |
| No in-app payments | OK | Not implemented (correct) |

**Missing Work:**
- Clarify: should non-certified users create sessions? Current RLS requires certification
- Implement GROUP-ONLY visibility: sessions with `group_id` AND `is_public=false` should only be visible to group members
- Add UI toggle in session creation for "Visible only to group members"

---

## 4) Search

| Requirement | Status | Notes |
|-------------|--------|-------|
| Global Search in Community | Done | Searches People, Groups, Sessions, Spots |
| People search by name/nickname | Done | Works |
| People preview snippet (next session / shared group) | Missing | Only shows name |
| `search_visibility` filter on people | Missing | Not implemented |
| Groups tab local search | Done | Works |
| Spots tab local search | Done | Works |
| Dedicated search results page with tabs | Missing | Results show inline, no tabbed UI |

**Missing Work:**
- Add route `/search?type=people&q=...` with tabbed results (Persone / Gruppi / Sessioni / Spot)
- Create People result cards with:
  - Avatar, name, coarse location
  - Pills: level + preference
  - Preview row: next public session OR shared group OR recent activity
  - Actions: "Segui" + "Vai al profilo"
- Filter by `search_visibility=true`

---

## 5) Privacy & Safety

| Requirement | Status | Notes |
|-------------|--------|-------|
| People not browsable by geography | OK | Not implemented (correct) |
| `search_visibility` option | Missing | Column not in profiles |
| Profiles show safe info only | OK | Current profile shows name, location, level |
| Don't expose session participation history | OK | Not shown |
| Show sessions CREATED by user on profile | Missing | Not implemented |

**Missing Work:**
- Add `search_visibility` to profiles + settings toggle in Profile page
- Public profile shows sessions created by that user

---

## 6) Routes & Pages

| Page | Route | Status |
|------|-------|--------|
| Groups Home | `/groups` | Done |
| Create Group | `/create/group` | Done (needs minor update: remove Focus tags) |
| Group Detail | `/groups/:id` | Done |
| Global Search | `/search` | Missing |
| User Profile (public) | `/users/:id` or `/profile/:id` | Missing |
| Spots | `/spots` | Done |
| Community | `/community` | Done |
| Create Session | `/create/session` | Done |
| Training | `/training` | Placeholder (correct for V1) |

---

## Summary of Missing Features (Priority Order)

### High Priority (Core Functionality)
1. **Search visibility** - Add `search_visibility` column to profiles + settings UI
2. **Public user profile page** - Create `/users/:id` with Follow button, sessions created
3. **Global Search page** - Tabbed results at `/search` with People cards per mockup
4. **Follow button on user profiles** - UI to follow/unfollow users
5. **Group-only session visibility** - Sessions with `group_id` + `is_public=false` visible only to members

### Medium Priority (Polish)
6. **Verified groups flag** - Add `verified` column for admin-managed schools/clubs
7. **Pending group membership** - For `requires_approval` groups, show pending state
8. **Remove Focus tags from Create Group** - Per simplified requirements
9. **People search preview snippets** - Show next session / shared group

### Low Priority (Deferred)
10. **Group follow system** - Optional secondary action on groups

---

## Database Changes Required

```sql
-- 1. Add search_visibility to profiles
ALTER TABLE public.profiles 
ADD COLUMN search_visibility boolean NOT NULL DEFAULT true;

-- 2. Add verified flag to groups
ALTER TABLE public.groups 
ADD COLUMN verified boolean NOT NULL DEFAULT false;
```

---

## New Files to Create

| File | Description |
|------|-------------|
| `src/pages/UserProfile.tsx` | Public user profile page |
| `src/pages/Search.tsx` | Global search with tabbed results |
| `src/hooks/useUserProfile.ts` | Fetch user profile + sessions created |
| `src/hooks/useFollow.ts` | Follow/unfollow users |
| `src/components/search/PersonResultCard.tsx` | People search result card |
| `src/components/search/SearchTabs.tsx` | Tab navigation for search |

## Files to Update

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Add search_visibility toggle in settings |
| `src/pages/CreateGroup.tsx` | Remove "Focus del gruppo" section |
| `src/hooks/useSearch.ts` | Add search_visibility filter, add preview data |
| `src/hooks/useSessions.ts` | Add group-only visibility logic |
| `src/App.tsx` | Add new routes |
| `src/lib/i18n.ts` | Add new translations |

---

## Implementation Order

**Phase 1: Database + Privacy Foundation**
- Add `search_visibility` to profiles
- Add `verified` to groups
- Update Profile page with visibility toggle

**Phase 2: User Profiles & Following**
- Create public user profile page
- Create follow hook
- Add Follow button UI

**Phase 3: Search Enhancement**
- Create Search page with tabs
- Create People result cards with previews
- Filter by visibility

**Phase 4: Session Visibility**
- Implement group-only session logic
- Add toggle in session creation

**Phase 5: Groups Polish**
- Remove Focus tags from Create Group
- Implement pending membership flow
- Add verified badge logic
