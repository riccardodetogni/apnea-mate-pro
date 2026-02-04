

# Groups Feature - Complete Implementation Plan

Based on the HTML mockups provided and analysis of the current codebase, here's a comprehensive plan to implement the full Groups feature.

---

## Current State Analysis

**What exists:**
- `groups` table in database with basic columns (id, name, description, activity_type, location, coordinates, avatar_url, is_public, created_by, timestamps)
- `group_members` table for membership tracking
- `group_tags` table for storing group tags
- `useGroups.ts` hook with basic fetch/join/leave logic
- `GroupCard.tsx` component (basic version)
- `Groups.tsx` page using **hardcoded mock data** instead of the hook

**What's missing from the mockups:**

1. **Groups List Page (7.0):**
   - Top bar with "Crea gruppo" button
   - Search input with filter chips (Tutti, Scuole & club, I tuoi gruppi, Gruppi vicino)
   - Multiple sections: "Scuole & Club Certificati", "I tuoi gruppi", "Gruppi popolari"
   - Different badge types: verified, partner, admin, spontaneo
   - Different action buttons per context

2. **Group Details Page (7.1):**
   - Hero card with gradient background
   - Group info with badges
   - Join/Share buttons
   - Description section with tags
   - Upcoming sessions list
   - Active courses list (placeholder for V1)
   - Members section with avatars

3. **Create Group Page (7.2):**
   - Form with name, location, group type
   - Multi-select focus tags (Profondità, Dinamica, Statica, etc.)
   - Description textarea
   - Visibility toggle (open vs request-to-join)

4. **Database additions needed:**
   - `requires_approval` column in groups table
   - `group_type` column (community vs school/club)

---

## Implementation Plan

### Phase 1: Database Schema Updates

Add missing columns to the `groups` table:

```sql
ALTER TABLE public.groups 
ADD COLUMN requires_approval boolean NOT NULL DEFAULT false,
ADD COLUMN group_type text NOT NULL DEFAULT 'community';
```

Enable realtime for the groups table for live updates.

---

### Phase 2: Groups List Page Refactor

**File: `src/pages/Groups.tsx`**

Transform from static mockup to fully functional:
- Use `useGroups` hook instead of hardcoded data
- Add top header with user avatar and "Crea gruppo" button
- Add search bar with filter chips
- Create three sections:
  1. **Scuole & Club Certificati** - groups where `creator_is_instructor = true`
  2. **I tuoi gruppi** - groups where user is member or creator
  3. **Gruppi popolari** - remaining public groups sorted by member count
- Loading/empty states

**New Components:**
- `GroupsHeader.tsx` - Top bar with title and create button
- `GroupFilterChips.tsx` - Filter chips row

**Update: `src/components/community/GroupCard.tsx`**

Expand to support different contexts:
- Add `isVerified`, `isPartner`, `isAdmin`, `isSpontaneous` badge props
- Add `onViewProfile`, `onFollow`, `onManage`, `onViewMembers` action callbacks
- Show different buttons based on membership/admin status

---

### Phase 3: Group Details Page

**New Route:** `/groups/:id`

**New File: `src/pages/GroupDetails.tsx`**

Sections:
1. **Hero Card** - Gradient background with avatar, name, location, badges
2. **Action Buttons** - Join/Leave, Share
3. **Description** - With focus tags
4. **Upcoming Sessions** - List of public sessions linked to this group
5. **Courses** - Placeholder for V1 (coming soon message)
6. **Members** - Avatar stack with count and "view all" link

**New Hook: `src/hooks/useGroupDetails.ts`**

Fetch single group with:
- Member list with profiles
- Sessions linked to this group
- Check if current user is admin/member

---

### Phase 4: Create Group Page

**New Route:** `/create/group`

**New File: `src/pages/CreateGroup.tsx`**

Form fields:
- **Nome del gruppo** - text input
- **Zona principale** - text input (location)
- **Tipo di gruppo** - pill toggle: "Community spontanea" | "Scuola / club"
- **Focus del gruppo** - multi-select pills: Profondità, Dinamica, Statica, Allenamento a secco, Ricreativo
- **Descrizione** - textarea
- **Visibilità** - pill toggle: "Gruppo aperto" | "Accesso su richiesta"

On submit:
1. Insert into `groups` table
2. Insert selected focus tags into `group_tags`
3. Add creator as admin member in `group_members`
4. Navigate to the new group details page

**Update: `src/pages/Create.tsx`**
- Link "group" option to `/create/group`

---

### Phase 5: i18n Updates

Add new translation keys:

```
// Groups
createGroupTitle: "Crea un gruppo",
groupTypeLabel: "Tipo di gruppo",
groupTypeCommunity: "Community spontanea",
groupTypeSchool: "Scuola / club",
groupFocusLabel: "Focus del gruppo",
focusDepth: "Profondità",
focusDynamic: "Dinamica",
focusStatic: "Statica",
focusDryTraining: "Allenamento a secco",
focusRecreational: "Ricreativo",
groupVisibility: "Visibilità",
visibilityOpen: "Gruppo aperto",
visibilityApproval: "Accesso su richiesta",
groupDescription: "Descrizione",
verifiedClub: "Verified club",
schoolPartner: "Scuola partner",
spontaneousGroup: "Gruppo spontaneo",
youAreAdmin: "Sei admin",
manageGroup: "Gestisci gruppo",
viewMembers: "Vedi membri",
followGroup: "Segui gruppo",
goToProfile: "Vai al profilo",
upcomingSessions: "Prossime sessioni",
activeCourses: "Corsi attivi",
membersSection: "Membri",
allMembers: "Vedi tutti i membri",
groupMainZone: "Zona principale",
groupNamePlaceholder: "Es. Lago Lovers – Nord Italia",
groupLocationPlaceholder: "Es. Lago di Garda · Nord Italia",
groupDescPlaceholder: "Racconta in poche righe cosa fate...",
schoolClubCertified: "Scuole & Club Certificati",
yourGroups: "I tuoi gruppi",
popularGroups: "Gruppi popolari",
searchGroupsPlaceholder: "Cerca scuola o gruppo",
filterAll: "Tutti",
filterSchools: "Scuole & club",
filterYourGroups: "I tuoi gruppi",
filterNearby: "Gruppi vicino a te"
```

---

### Phase 6: Navigation & Routing

**Update `src/App.tsx`:**
```tsx
<Route path="/groups/:id" element={<GroupDetails />} />
<Route path="/create/group" element={<CreateGroup />} />
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/GroupDetails.tsx` | Group detail view page |
| `src/pages/CreateGroup.tsx` | Group creation form page |
| `src/hooks/useGroupDetails.ts` | Hook to fetch single group with members/sessions |
| `src/components/groups/GroupHeroCard.tsx` | Gradient hero card component |
| `src/components/groups/GroupFilterChips.tsx` | Filter chips for groups list |
| `src/components/groups/GroupMembersSection.tsx` | Members avatar stack section |
| `src/components/groups/GroupSessionsList.tsx` | List of upcoming sessions |

## Files to Update

| File | Changes |
|------|---------|
| `src/pages/Groups.tsx` | Replace mock data with real data, add sections |
| `src/pages/Create.tsx` | Link to `/create/group` |
| `src/components/community/GroupCard.tsx` | Add badge variants, action callbacks |
| `src/hooks/useGroups.ts` | Add filtering by category, user membership |
| `src/lib/i18n.ts` | Add new translation keys |
| `src/App.tsx` | Add new routes |

---

## Database Migration

```sql
-- Add missing columns to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'community';

-- Enable realtime for groups
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
```

---

## Summary

This plan implements the complete Groups feature as shown in the mockups:

1. **Groups List** with search, filters, and categorized sections
2. **Group Details** with hero card, sessions, members
3. **Create Group** form with all required fields
4. **Database updates** for approval and group type tracking

All components will follow the existing design system (card-group, badge-tag, etc.) and use the established patterns from sessions implementation.

