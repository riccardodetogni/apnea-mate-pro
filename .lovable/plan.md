
# Implementation Plan: Discover Freedivers Feature

## Overview
Create a dedicated "Discover Freedivers" page at `/discover` that helps users find and follow other freedivers when they have an empty feed or want to expand their social graph.

---

## Technical Approach

### 1. New Route and Page
- **Route**: `/discover`
- **Page**: `src/pages/DiscoverFreedivers.tsx`

### 2. Discovery Hook
- **File**: `src/hooks/useDiscoverFreedivers.ts`
- Fetches profiles with intelligent prioritization
- Handles follow/unfollow actions with optimistic updates

### 3. Navigation Update
- Update the `EmptyCard` action in `Community.tsx` to navigate to `/discover` instead of `/profile`

---

## Discovery Logic (Prioritization)

The hook will fetch and score users based on multiple factors:

```text
1. Base Query
   - Exclude current user
   - Exclude already-followed users
   - Only include users with search_visibility = true

2. Scoring Factors (applied client-side)
   - Geographic proximity (if user location available)
   - Shared activity: same groups, same spots, same sessions
   - Role priority: instructor > certified > regular
   - Recent activity: users who created sessions recently

3. Fallback Logic
   - If no nearby users: show globally active users
   - Prioritize instructors and certified users
```

---

## Data Fetching Strategy

### Query 1: Get candidate profiles
```sql
SELECT profiles.*, user_roles.role
FROM profiles
LEFT JOIN user_roles ON profiles.user_id = user_roles.user_id
WHERE search_visibility = true
  AND user_id != current_user
  AND user_id NOT IN (SELECT following_id FROM follows WHERE follower_id = current_user)
```

### Query 2: Get shared groups for scoring
```sql
SELECT user_id, group_id 
FROM group_members
WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = current_user)
```

### Query 3: Get recent sessions for activity summary
```sql
SELECT creator_id, session_type, COUNT(*) 
FROM sessions
WHERE creator_id IN (candidate_ids)
GROUP BY creator_id, session_type
```

---

## UI Components

### DiscoverFreedivers Page Layout
```text
┌─────────────────────────────────────┐
│ ← Scopri apneisti                   │  Header with back button
├─────────────────────────────────────┤
│ 🔍 Cerca apneisti...                │  Optional search filter
├─────────────────────────────────────┤
│ Suggeriti per te                    │  Section header
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👤 Marco Rossi                  │ │  Profile card
│ │    📍 Milano • 🏅 Istruttore    │ │  Location + badge
│ │    🏊 Deep training, Mare       │ │  Activity summary
│ │    ─────────────────────────    │ │
│ │    [ Segui ]  [ Vai al profilo ]│ │  Actions
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Anna Bianchi                 │ │
│ │    📍 Genova • 🏅 Certificato   │ │
│ │    🌊 Uscite mare               │ │
│ │    ─────────────────────────    │ │
│ │    [ Segui ]  [ Vai al profilo ]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Empty State (when no suggestions)
```text
"Non ci sono altri apneisti da suggerirti al momento. 
 Torna più tardi o cerca per nome."
```

### Gentle suggestion (when user follows no one)
```text
"Segui almeno un apneista per vedere le sue sessioni nella Community!"
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/DiscoverFreedivers.tsx` | Main discovery page with list of suggested users |
| `src/hooks/useDiscoverFreedivers.ts` | Hook for fetching, scoring, and managing follows |

## Files to Update

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/discover` |
| `src/pages/Community.tsx` | Update EmptyCard action to navigate to `/discover` |
| `src/lib/i18n.ts` | Add new translations for discover feature |

---

## Scoring Algorithm Details

```typescript
interface UserScore {
  user_id: string;
  score: number;
}

// Scoring weights
const WEIGHTS = {
  nearbyBonus: 50,           // Within 100km
  veryNearbyBonus: 30,       // Within 50km bonus
  sharedGroupBonus: 20,      // Per shared group (max 3)
  instructorBonus: 25,       // Is instructor
  certifiedBonus: 15,        // Is certified
  recentActivityBonus: 10,   // Created session in last 30 days
};

// Final list sorted by score DESC
```

---

## Activity Summary Generation

The activity summary shows what type of diving the user prefers:

```typescript
// Based on session types they've created
const activityLabels: Record<string, string> = {
  "deep_pool_session": "Piscina profonda",
  "sea_trip": "Uscite mare",
  "static_session": "Statica",
  "dynamic_session": "Dinamica",
  // fallback
  "default": "Apneista attivo"
};

// Display up to 2 activity types
// e.g., "Piscina profonda, Uscite mare"
```

---

## Follow Action Behavior

1. User taps "Segui" button
2. Optimistic UI update: button changes to "Seguito"
3. Insert into `follows` table
4. On success: show toast "Ora segui [Nome]"
5. On error: revert button, show error toast
6. User's sessions will appear in Community feed on next refresh

---

## Implementation Sequence

1. **Create `useDiscoverFreedivers.ts`** hook with:
   - `fetchSuggestions()` - main fetch with scoring
   - `toggleFollow()` - optimistic follow/unfollow
   - State: `suggestions`, `loading`, `followingIds`

2. **Create `DiscoverFreedivers.tsx`** page with:
   - Back header
   - Optional search filter
   - Scrollable list of user cards
   - Empty state handling

3. **Update routing** in `App.tsx`

4. **Update navigation** in `Community.tsx`

5. **Add translations** in `i18n.ts`

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| User follows everyone | Show "Non ci sono altri apneisti da suggerirti" |
| No nearby users | Show global users, prioritize instructors/certified |
| No location permission | Score without proximity, still show suggestions |
| Search yields no results | Keep showing original suggestions |
| Follow fails | Revert UI, show error toast |
