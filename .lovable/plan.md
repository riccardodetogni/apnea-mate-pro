

# Updated Plan: Insurance Flag — Include in Onboarding

## What changes from the previous plan

Add the insurance question to the **onboarding flow** as well as the Profile page.

## Onboarding Integration

The current flow has 5 steps: 1) Profile Info, 2) Certification Status, 3) Certification Details, 4) Personal Bests, 5) Safety Disclaimer.

**Add insurance to Step 2** (Certification Status), since it's related — the user is already thinking about their credentials. Below the certification selection, add:
- A toggle/switch: "Do you have freediving insurance?" (e.g. DAN)
- If toggled on, show a text input for the provider name (placeholder: "DAN, FIAS, etc.")

This keeps the step count at 5 (no new step needed) and groups related safety/credential info together.

## Full Implementation Summary

### Database
- Add `has_insurance boolean NOT NULL DEFAULT false` and `insurance_provider text` (nullable) to `profiles` table.

### Files to modify

1. **`src/hooks/useProfile.ts`** — Add `has_insurance` and `insurance_provider` to the `Profile` interface and `updateProfile` allowed fields.

2. **`src/pages/Onboarding.tsx`** — In Step 2 (certification selection), add an insurance toggle + provider input. Save the values in `handleComplete` alongside the existing profile update.

3. **`src/pages/Profile.tsx`** — Add insurance toggle + tappable provider text in the settings section.

4. **`src/components/profile/ProfileEditDialog.tsx`** — Add `"insurance_provider"` as a supported field type.

5. **`src/pages/UserProfile.tsx`** — Show an insurance badge (e.g. shield icon + "DAN Insured") on profiles that have insurance enabled.

6. **`src/lib/i18n.ts`** — Add keys: `insurance` / "Assicurazione" / "Insurance", `insured` / "Assicurato" / "Insured", `insuranceProvider` / "Ente assicurativo" / "Insurance provider", `hasInsurance` / "Hai un'assicurazione subacquea?" / "Do you have diving insurance?"

### Implementation order
1. DB migration (add columns)
2. Update `useProfile` hook
3. Update Onboarding Step 2
4. Update Profile page (toggle + edit)
5. Show badge on UserProfile
6. i18n keys

