

# Add "Years freediving" field to profile

## Overview
Add a new optional field `freediving_since` to user profiles capturing when the user started freediving. The UI displays it as "X anni di apnea" / "X years freediving" (computed from the year). Editable inline from the profile page, optional during onboarding, visible on public profiles.

## Data model
Add one column to `profiles`:
- `freediving_since` — `integer` nullable — stores the **year** the user started (e.g., `2018`). Storing a year (not a duration) keeps the displayed value accurate over time without periodic updates.

Validation: year between 1950 and current year (enforced client-side; no DB constraint to avoid mutability issues).

## UI changes

### 1. Profile page (`src/pages/Profile.tsx`)
- Below the location/bio block, add a tappable row showing "🌊 X anni di apnea (dal YYYY)" or, if empty, an "+ Aggiungi anni di apnea" button (mirroring the location/bio pattern).
- Tapping opens the edit dialog.

### 2. Profile edit dialog (`src/components/profile/ProfileEditDialog.tsx`)
- Add new field type `freediving_since` with a numeric year input (4 digits, min 1950, max current year).
- Label: "Anno di inizio apnea" / "Year you started freediving".
- Helper text under the input: live preview "X anni di esperienza" / "X years of experience".

### 3. Onboarding (`src/pages/Onboarding.tsx`)
- In Step 1 (profile info), add an optional "Da quanto fai apnea?" field: a year input next to bio, with placeholder "es. 2018".
- Save it in `handleComplete` alongside other profile fields.

### 4. Public profile (`src/pages/UserProfile.tsx` + `src/hooks/useUserProfile.ts`)
- Fetch and display `freediving_since` as "X anni di apnea" near the bio/location.
- Only show when value exists.

### 5. Hooks
- `src/hooks/useProfile.ts`: add `freediving_since` to the `Profile` interface and to the `updateProfile` allowed keys.
- `src/hooks/useUserProfile.ts`: include `freediving_since` in the select and `UserProfileData` interface.

### 6. Translations (`src/lib/i18n.ts`)
Add IT/EN keys:
- `freedivingSince` → "Da quanto fai apnea?" / "How long have you been freediving?"
- `freedivingSinceYear` → "Anno di inizio" / "Starting year"
- `yearsFreediving` → "{n} anni di apnea" / "{n} years freediving"
- `addFreedivingYears` → "Aggiungi anni di apnea" / "Add freediving years"
- `freedivingYearPlaceholder` → "es. 2018" / "e.g. 2018"

## Helper utility
Small helper `getYearsFreediving(year: number): number` → `new Date().getFullYear() - year`. Inlined where used (no separate file needed).

## Database migration
```sql
ALTER TABLE public.profiles
ADD COLUMN freediving_since integer;
```

No RLS changes required — existing `profiles` policies cover the new column.

## Out of scope
- No badges/levels based on years of experience.
- No filtering/sorting by experience in discovery.
- No backfill of existing users (column nullable, defaults to empty state).

