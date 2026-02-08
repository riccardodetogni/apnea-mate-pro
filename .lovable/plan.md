

# Personal Bests Feature + Registration Flow Review

## Registration Flow (Current - Working Correctly)
The registration flow is already well-structured:
1. User enters email + password on the registration screen
2. A "Check your email" confirmation screen appears
3. User clicks the verification link in their inbox
4. On first login, the app detects the profile has no location and redirects to onboarding
5. Onboarding collects: Name, Bio, Location -> Certification question -> Certification details (if yes) -> Safety disclaimer
6. User lands in the Community

No changes needed to the core auth flow -- it works as designed.

## New Feature: Personal Bests

Add a "Personal Bests" (PB) section where freedivers can log their records. Users can choose to show or hide PBs on their profile.

### Freediving PB fields:
- **Max depth (CWT)** -- Constant Weight, in meters
- **Max static hold (STA)** -- Static Apnea, in minutes:seconds
- **Max dynamic distance (DYN)** -- Dynamic Apnea, in meters
- **Max dynamic no-fins (DNF)** -- Dynamic No-Fins, in meters
- **Max free immersion (FIM)** -- Free Immersion depth, in meters

All fields are optional. A visibility toggle controls whether PBs are shown on the public profile.

---

## Changes

### 1. Database: New `personal_bests` table

Create a table to store each user's personal bests:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users, unique |
| max_depth_cwt | numeric | Meters, nullable |
| max_static_sta | integer | Seconds, nullable (displayed as mm:ss) |
| max_dynamic_dyn | numeric | Meters, nullable |
| max_dynamic_dnf | numeric | Meters, nullable |
| max_fim | numeric | Meters, nullable |
| show_on_profile | boolean | Default true |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

RLS Policies:
- SELECT: Anyone can view PBs (but the UI will respect `show_on_profile`)
- INSERT: Users can insert their own PBs (`auth.uid() = user_id`)
- UPDATE: Users can update their own PBs (`auth.uid() = user_id`)

Add `update_updated_at_column` trigger for automatic timestamp updates.

### 2. Onboarding: Add optional PB step

Insert a new step between the current certification step and the safety step:
- Current flow: Step 1 (Info) -> Step 2 (Certified?) -> Step 3 (Cert details) -> Step 4 (Safety)
- New flow: Step 1 (Info) -> Step 2 (Certified?) -> Step 3 (Cert details) -> **Step 4 (Personal Bests)** -> Step 5 (Safety)

The PB step is fully optional -- all fields can be left blank. It shows:
- Friendly input fields for each discipline with appropriate units (m, mm:ss)
- A note saying "You can always update these later"
- Skip-friendly: user can proceed without filling anything

### 3. Profile page: Display PBs

Add a "Personal Bests" card on the Profile page (`src/pages/Profile.tsx`) between the certification section and the settings section:
- Shows each PB that has a value, with discipline label + value + unit
- Displays a toggle to show/hide PBs on public profile
- If no PBs set, shows a prompt to add them

### 4. User Profile page: Display PBs (public)

On `src/pages/UserProfile.tsx`, show the PBs section if the user has set `show_on_profile = true` and has at least one PB value.

### 5. Settings page: Edit PBs

Add a "Personal Bests" section on the Settings page where users can edit all PB fields and the visibility toggle.

### 6. Hook: `usePersonalBests`

New hook `src/hooks/usePersonalBests.ts` to:
- Fetch PBs for the current user (or a given user ID)
- Upsert PBs (insert if not exists, update if exists)
- Toggle visibility

### 7. i18n translations

Add translation keys for:
- personalBests, maxDepthCWT, maxStaticSTA, maxDynamicDYN, maxDynamicDNF, maxFIM
- showOnProfile, addPersonalBests, noPersonalBests, updateLater
- Discipline labels and units

## Technical Details

### personal_bests table SQL:
```text
CREATE TABLE public.personal_bests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  max_depth_cwt numeric,
  max_static_sta integer, -- stored in seconds
  max_dynamic_dyn numeric,
  max_dynamic_dnf numeric,
  max_fim numeric,
  show_on_profile boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view personal bests"
  ON public.personal_bests FOR SELECT USING (true);

CREATE POLICY "Users can insert own personal bests"
  ON public.personal_bests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal bests"
  ON public.personal_bests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_personal_bests_updated_at
  BEFORE UPDATE ON public.personal_bests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Onboarding step structure (updated):
```text
type Step = 1 | 2 | 3 | 4 | 5;

Step 1: Name, Bio, Location (existing)
Step 2: Are you certified? (existing)
Step 3: Certification details (existing, only if certified)
Step 4: Personal Bests (NEW, optional)
Step 5: Safety disclaimer (existing, renumbered)
```

### Static time display helper:
```text
// Convert seconds to "m:ss" format
formatStaticTime(180) -> "3:00"
formatStaticTime(215) -> "3:35"

// Parse "m:ss" input to seconds
parseStaticTime("3:35") -> 215
```

### PB display component (reusable for Profile and UserProfile):
```text
PersonalBestsCard component:
- Takes: pbs data object, editable boolean, onToggleVisibility callback
- Renders each non-null PB as a row with icon, label, value, unit
- If editable, shows the visibility toggle
- Disciplines shown with emoji/icons:
  - CWT (depth): arrow-down icon, "m"
  - STA (static): timer icon, "m:ss"
  - DYN (dynamic): arrow-right icon, "m"
  - DNF (no-fins): arrow-right icon, "m"
  - FIM (free immersion): arrow-down icon, "m"
```

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create `personal_bests` table with RLS |
| `src/hooks/usePersonalBests.ts` | New hook for PB CRUD |
| `src/components/profile/PersonalBestsCard.tsx` | New display component |
| `src/components/profile/PersonalBestsForm.tsx` | New edit form component |
| `src/pages/Onboarding.tsx` | Add Step 4 (PBs), renumber Step 5 |
| `src/pages/Profile.tsx` | Add PBs card with visibility toggle |
| `src/pages/UserProfile.tsx` | Show PBs if public |
| `src/pages/Settings.tsx` | Add PBs edit section |
| `src/lib/i18n.ts` | Add ~15 new translation keys |
