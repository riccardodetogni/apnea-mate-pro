
# Implementation Plan: Complete Placeholder Features

## Overview
This plan addresses four features that are currently placeholders or incomplete in the app:
1. Spot Details page at `/spots/:id`
2. View All Members sheet for groups
3. Group join request improvements
4. Leave group functionality (already partially implemented, needs integration)

---

## 1. Spot Details Page

### Current State
- Clicking "Vedi dettagli spot" shows a "Coming soon" toast
- No `/spots/:id` route exists

### Implementation

**New Files:**
| File | Description |
|------|-------------|
| `src/pages/SpotDetails.tsx` | Full spot details page |
| `src/hooks/useSpotDetails.ts` | Hook to fetch spot data and related sessions |

**Route Addition:**
```text
/spots/:id → SpotDetails
```

**Page Layout:**
```text
┌─────────────────────────────────────┐
│ ← Spot Details                      │  Back button
├─────────────────────────────────────┤
│  🌊                                 │
│  Spot Name                          │  Hero section with
│  📍 Location                        │  environment emoji
│  🏊 Mare · 40m depth               │  Type + depth badge
├─────────────────────────────────────┤
│  Description text here...           │
├─────────────────────────────────────┤
│  🗺️ Map Preview                    │  Mini map with marker
├─────────────────────────────────────┤
│  Prossime sessioni qui              │  Sessions at this spot
│  [SessionCard] [SessionCard]        │
├─────────────────────────────────────┤
│  [ ❤️ Preferiti ]  [ 📍 Indicazioni ]│  Action buttons
└─────────────────────────────────────┘
```

**Data to Display:**
- Spot name, location, environment type
- Description (if available)
- Coordinates on a mini map
- Upcoming sessions at this spot (query sessions where spot_id matches)
- Favorite toggle button
- "Get directions" button (opens Google Maps)

---

## 2. View All Members Sheet

### Current State
- `GroupMembersSection` has `onViewAll` prop but it does nothing (TODO comment)
- Members are shown as avatar circles, max 6 displayed

### Implementation

**New Files:**
| File | Description |
|------|-------------|
| `src/components/groups/GroupMembersSheet.tsx` | Bottom sheet showing all members |

**Sheet Layout:**
```text
┌─────────────────────────────────────┐
│ Membri (24)                      ✕  │  Title with count
├─────────────────────────────────────┤
│ 🔍 Cerca membri...                  │  Optional search
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👤 Marco Rossi          Owner   │ │  Member row
│ │    Istruttore                   │ │  Role badge
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Anna Bianchi         Admin   │ │
│ │    Certificato                  │ │
│ └─────────────────────────────────┘ │
│ ...scrollable list...               │
└─────────────────────────────────────┘
```

**Features:**
- Shows all approved members (filter out pending)
- Display role badge (owner, admin, member)
- Show certification status if available
- Clicking a member navigates to their profile (`/users/:id`)

**Integration:**
- Update `GroupDetails.tsx` to open the sheet when "Vedi tutti i membri" is clicked
- Pass full members list and group owner info to the sheet

---

## 3. Group Join Request Flow

### Current State
- Already works from GroupDetails page
- Uses `requires_approval` to determine if pending or instant join
- Shows "In attesa di approvazione" state for pending

### Improvements Needed
- Ensure consistent behavior across Community tab and Groups tab
- Already implemented in `useGroups.ts` with `joinGroup(groupId)`
- Toast messages already show "Richiesta inviata" for pending joins

**Verification:**
- The join flow is already properly implemented
- No changes needed, just verification

---

## 4. Leave Group Functionality

### Current State
- `leaveGroup()` exists in `useGroupDetails.ts`
- Works from the GroupDetails page (shows "Lascia gruppo" button for members)
- Not available from Groups tab cards

### Improvements Needed
- The leave button is already visible in GroupDetails for members
- Should NOT be on group cards (requires going to group details page)
- Current implementation is correct and follows UX best practices

**Verification:**
- Leave functionality is already implemented on the GroupDetails page
- It shows for users who are members but not owners
- No changes needed

---

## Technical Summary

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/SpotDetails.tsx` | Spot details page |
| `src/hooks/useSpotDetails.ts` | Fetch spot + related sessions |
| `src/components/groups/GroupMembersSheet.tsx` | All members bottom sheet |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/spots/:id` route |
| `src/pages/Spots.tsx` | Navigate to spot details instead of toast |
| `src/pages/GroupDetails.tsx` | Wire up members sheet |
| `src/lib/i18n.ts` | Add new translation keys |

### Database Queries

**Spot Details:**
```sql
SELECT * FROM spots WHERE id = :spotId
```

**Sessions at Spot:**
```sql
SELECT * FROM sessions 
WHERE spot_id = :spotId 
  AND status = 'active'
  AND date_time >= now()
ORDER BY date_time ASC
LIMIT 10
```

**Members with Roles (already fetched in useGroupDetails):**
```sql
SELECT gm.*, p.name, p.avatar_url, ur.role as user_role
FROM group_members gm
JOIN profiles p ON p.user_id = gm.user_id
LEFT JOIN user_roles ur ON ur.user_id = gm.user_id
WHERE gm.group_id = :groupId
  AND gm.status = 'approved'
```

---

## New Translations

```typescript
// Italian
spotDetails: "Dettagli spot",
sessionsAtSpot: "Sessioni in questo spot",
noSessionsAtSpot: "Nessuna sessione programmata qui",
getDirections: "Indicazioni",
depth: "Profondità",
groupMembersTitle: "Membri",
searchMembers: "Cerca membri...",
ownerBadge: "Owner",
adminBadge: "Admin",
memberBadge: "Membro",

// English
spotDetails: "Spot details",
sessionsAtSpot: "Sessions at this spot",
noSessionsAtSpot: "No sessions scheduled here",
getDirections: "Get directions",
depth: "Depth",
groupMembersTitle: "Members",
searchMembers: "Search members...",
ownerBadge: "Owner",
adminBadge: "Admin",
memberBadge: "Member",
```

---

## Implementation Sequence

1. **Create `useSpotDetails.ts`** hook
   - Fetch spot by ID
   - Fetch upcoming sessions at this spot
   - Return loading/error states

2. **Create `SpotDetails.tsx`** page
   - Back header
   - Hero section with spot info
   - Mini map with marker
   - Sessions list
   - Action buttons (favorite, directions)

3. **Update routing**
   - Add `/spots/:id` route in App.tsx
   - Update Spots.tsx to navigate instead of toast

4. **Create `GroupMembersSheet.tsx`**
   - Bottom sheet with member list
   - Role badges and profile navigation

5. **Wire up members sheet**
   - Update GroupDetails.tsx to open sheet

6. **Add translations**
   - Update i18n.ts with new keys
