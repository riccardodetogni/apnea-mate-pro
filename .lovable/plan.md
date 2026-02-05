
# Plan: Smart Back Button Navigation with State

## Problem
Sessions (and other detail pages) can be accessed from multiple entry points:
- Community → Session (back should go to /community)
- Spot Details → Session (back should go to /spots/:id)
- Group Details → Session (back should go to /groups/:id)
- My Sessions → Session (back should go to /my-sessions)
- Search → Session (back should go to /search or /community)

Hardcoding back routes doesn't work because the correct destination depends on how the user arrived at the page.

## Solution: Navigation State

React Router's `navigate()` supports passing state that can be read on the destination page:

```typescript
// When navigating TO a page
navigate(`/sessions/${id}`, { state: { from: '/spots/abc123' } });

// On the destination page, read state and use it for back
const location = useLocation();
const backPath = location.state?.from || '/community'; // fallback to default
navigate(backPath);
```

## Implementation Strategy

### 1. Define Back Fallbacks
Each page type has a logical "parent" fallback:
- Sessions → /community
- Spots → /spots
- Groups → /groups
- User Profiles → /community
- Edit pages → their detail page

### 2. Pass `from` State When Navigating
Update all navigation calls to include the current path:

| Source Page | Navigation Call |
|------------|-----------------|
| SpotDetails.tsx (line 187) | `navigate(\`/sessions/\${session.id}\`, { state: { from: \`/spots/\${id}\` } })` |
| GroupSessionsList.tsx (line 48) | `navigate(\`/sessions/\${session.id}\`, { state: { from: \`/groups/\${groupId}\` } })` - requires passing groupId as prop |
| MySessions.tsx (lines 68, 113) | `navigate(\`/sessions/\${session.id}\`, { state: { from: '/my-sessions' } })` |
| Community.tsx (lines 197, 321, 376, etc.) | `navigate(\`/sessions/\${sessionId}\`, { state: { from: '/community' } })` |

### 3. Read State on Detail Pages
Update detail pages to use state for back navigation:

```typescript
const location = useLocation();
const backPath = (location.state as { from?: string })?.from || '/community';

// Back button
<button onClick={() => navigate(backPath)}>
```

## Files to Modify

### Pass navigation state (source pages):
| File | Changes |
|------|---------|
| `src/pages/SpotDetails.tsx` | Pass `from: /spots/${id}` when clicking sessions |
| `src/components/groups/GroupSessionsList.tsx` | Accept `groupId` prop, pass `from: /groups/${groupId}` |
| `src/pages/GroupDetails.tsx` | Pass `groupId` to GroupSessionsList |
| `src/pages/MySessions.tsx` | Pass `from: /my-sessions` when clicking sessions |
| `src/pages/Community.tsx` | Pass `from: /community` for all session/group clicks |

### Read navigation state (destination pages):
| File | Back Fallback |
|------|---------------|
| `src/pages/SessionDetails.tsx` | `/community` |
| `src/pages/SpotDetails.tsx` | `/spots` |
| `src/pages/UserProfile.tsx` | `/community` |
| `src/pages/MySessions.tsx` | `/community` |
| `src/pages/Search.tsx` | `/community` |
| `src/pages/Admin.tsx` | `/profile` |
| `src/pages/DiscoverFreedivers.tsx` | `/community` |
| `src/pages/EditSession.tsx` | `/sessions/${id}` |

## Example Implementation

**SpotDetails.tsx** (passing state):
```typescript
onClick={() => navigate(`/sessions/${session.id}`, { 
  state: { from: `/spots/${id}` } 
})}
```

**SessionDetails.tsx** (reading state):
```typescript
const location = useLocation();
const backPath = (location.state as { from?: string })?.from || '/community';

// In back button:
onClick={() => navigate(backPath)}
```

## Benefits
- No navigation loops possible
- Always goes to logical parent
- Graceful fallback if state is missing (e.g., direct URL access)
- Works with browser back button too (history still works normally)
