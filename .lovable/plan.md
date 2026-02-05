
# Plan: Multiple Bug Fixes and Enhancements

## Summary
This plan addresses 7 distinct fixes and enhancements across the application: session type auto-fill from spots, participant input fix, navigation improvements, verified partner flow, location picker, certification agency addition, and spot marker colors based on session availability.

---

## Fix Details

### 1. Session Type Auto-Filled from Spot

**Current Behavior**: When selecting a spot in CreateSession, the session type dropdown stays at "sea_trip" regardless of spot environment.

**Expected Behavior**: When a spot is selected, automatically set session_type based on the spot's environment_type:
- `sea` → `sea_trip`
- `pool` → `pool_session`
- `deep_pool` → `deep_pool_session`
- `lake` → `lake_trip`

**File**: `src/pages/CreateSession.tsx`

**Changes**:
- Add an `useEffect` that watches for `form.spot_id` changes
- When spot is selected, look up its environment_type from the spots array
- Map environment_type to corresponding session_type and update form state

---

### 2. Max Participants Input Bug Fix

**Current Behavior**: The number input for max_participants doesn't clear properly when user deletes to single digit, and resets unexpectedly to 6.

**Issue**: The `parseInt(e.target.value) || 6` logic means when user deletes characters leaving NaN, it resets to 6.

**Expected Behavior**: Allow free text editing while typing, validate on blur, and enforce min/max constraints.

**File**: `src/pages/CreateSession.tsx`

**Changes**:
- Store the raw input as a string instead of using immediate parseInt
- Use a separate state or handle empty string case gracefully
- On blur or submit, parse and validate the value with proper min/max bounds
- Same fix needed for duration_minutes input

---

### 3. Back Button After Create Goes to Home

**Current Behavior**: Back button in `Create.tsx` uses `navigate(-1)` which goes to previous page.

**Expected Behavior**: Back button should always go to home/community (`/community`).

**File**: `src/pages/Create.tsx`

**Changes**:
- Change `navigate(-1)` to `navigate("/community")`

---

### 4. Verified Partner Groups Flow

**Current Behavior**: The `CreateGroup.tsx` shows a message to contact the team for partner verification, but there's no actual implementation in the Admin panel to verify groups.

**Expected Behavior**: Admin should be able to toggle the `verified` flag on groups from the Admin dashboard.

**Files**:
- `src/pages/Admin.tsx` - Add Groups tab with verification controls
- `src/hooks/useAdmin.ts` - Add functions to fetch and update groups

**Changes**:
1. Add a "Groups" tab to Admin dashboard
2. Fetch all groups (or filter for `group_type = 'scuola_club'`)
3. Display each group with a toggle to set `verified = true/false`
4. Add a `toggleGroupVerification` function in useAdmin hook

---

### 5. Location from Maps in Register Form

**Current Behavior**: In `Onboarding.tsx`, users type their location manually in a text input.

**Expected Behavior**: Add ability to fetch location from device GPS or search using geocoding (similar to SpotCreator).

**File**: `src/pages/Onboarding.tsx`

**Changes**:
1. Add a "Use my location" button next to location input
2. Use browser Geolocation API to get coordinates
3. Reverse geocode using Nominatim to get city/region name
4. Auto-fill the location field with the result
5. Add loading state while fetching location

---

### 6. Add "Apnea Academy" to Certification Agencies

**Current Behavior**: The certification agencies list in `Onboarding.tsx` includes AIDA, SSI, PADI, CMAS, Molchanovs, Altro.

**Expected Behavior**: Add "Apnea Academy" to the list.

**File**: `src/pages/Onboarding.tsx`

**Changes**:
- Add "Apnea Academy" to the `certificationAgencies` array (between Molchanovs and Altro to maintain alphabetical order by common usage)

---

### 7. Spot Markers Color Based on Session Availability

**Current Behavior**: All spot markers on the map use the same default blue marker.

**Expected Behavior**:
- Spots WITH upcoming sessions: Colored pins (blue/green based on type)
- Spots WITHOUT upcoming sessions: Gray/white pins

**Files**:
- `src/hooks/useSpots.ts` - Add `hasActiveSessions` field to Spot interface and query
- `src/components/spots/SpotMap.tsx` - Use different marker colors based on session availability

**Changes**:
1. Modify `useSpots` to include a subquery checking for active future sessions
2. Add `hasActiveSessions: boolean` to the Spot interface
3. In SpotMap, create custom marker icons:
   - Colored (current behavior) for spots with sessions
   - Gray/desaturated for spots without sessions

---

## Technical Details

### Session Type Mapping (Fix 1)

```typescript
const environmentToSessionType: Record<string, string> = {
  sea: "sea_trip",
  pool: "pool_session", 
  deep_pool: "deep_pool_session",
  lake: "lake_trip",
};
```

### Participants Input Fix (Fix 2)

```typescript
// Handle empty and partial input gracefully
const handleParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  // Allow empty string while typing
  if (value === "") {
    setForm({ ...form, max_participants: "" as any });
    return;
  }
  const parsed = parseInt(value, 10);
  if (!isNaN(parsed)) {
    setForm({ ...form, max_participants: parsed });
  }
};

// Validate on blur
const handleParticipantsBlur = () => {
  const value = form.max_participants;
  if (typeof value === "string" || value < 2) {
    setForm({ ...form, max_participants: 2 });
  } else if (value > 50) {
    setForm({ ...form, max_participants: 50 });
  }
};
```

### Admin Groups Tab (Fix 4)

Add a third tab "Gruppi" to Admin.tsx with:
- List of groups filtered by `group_type = 'scuola_club'`
- Each row shows group name, location, member count
- Toggle button or switch for `verified` status
- Database update on toggle

### Location Picker (Fix 5)

```typescript
const handleUseMyLocation = async () => {
  setLocationLoading(true);
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    const { latitude, longitude } = pos.coords;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    
    // Extract city and region
    const city = data.address?.city || data.address?.town || data.address?.village;
    const state = data.address?.state;
    setLocation([city, state].filter(Boolean).join(", "));
  } catch (error) {
    toast({ title: "Impossibile rilevare la posizione", variant: "destructive" });
  } finally {
    setLocationLoading(false);
  }
};
```

### Spots with Sessions Query (Fix 7)

The `useSpots` hook will need a modified query:
```typescript
const { data, error } = await supabase
  .from("spots")
  .select(`
    id, name, environment_type, location, latitude, longitude, description,
    sessions!inner(id)
  `)
  // This won't work directly - need to use RPC or separate query
```

Since Supabase doesn't easily support EXISTS subqueries in the client, we'll:
1. Fetch all spots
2. Fetch count of active sessions grouped by spot_id
3. Merge the data client-side

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateSession.tsx` | Fixes 1 and 2: Auto-fill session type, fix number inputs |
| `src/pages/Create.tsx` | Fix 3: Navigate to /community on back |
| `src/pages/Admin.tsx` | Fix 4: Add Groups tab with verification toggle |
| `src/hooks/useAdmin.ts` | Fix 4: Add group fetching and verification functions |
| `src/pages/Onboarding.tsx` | Fixes 5 and 6: Add location button, add Apnea Academy |
| `src/hooks/useSpots.ts` | Fix 7: Add hasActiveSessions to spots data |
| `src/components/spots/SpotMap.tsx` | Fix 7: Color markers based on session availability |

---

## Summary

| Fix | Complexity | Estimated Changes |
|-----|------------|-------------------|
| Session type auto-fill | Low | ~15 lines |
| Participants input | Low | ~20 lines |
| Back to home | Trivial | 1 line |
| Admin groups verification | Medium | ~100 lines across 2 files |
| Location from GPS | Medium | ~40 lines |
| Add Apnea Academy | Trivial | 1 line |
| Spot marker colors | Medium | ~50 lines across 2 files |

Total: 7 fixes in 7 files
