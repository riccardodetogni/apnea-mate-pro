

# Add "I am an Instructor" Checkbox to Onboarding

## Summary

Add an "I am an instructor" checkbox on Step 2 of onboarding (the certification step), visible only when the user selects "Yes" to being certified. When checked, the user gets the `instructor` role instead of `certified` upon completion.

## Best placement

Step 2 is where the user declares their certification status. The instructor checkbox fits naturally here — it appears right after selecting "Yes, I'm certified", before the insurance section. This keeps all role-related declarations together.

## Changes

### 1. `src/pages/Onboarding.tsx`
- Add `isInstructor` state (`false` by default)
- Show a checkbox with label "Sono un Istruttore" / "I am an Instructor" when `isCertified === true`, placed between the Yes/No buttons and the insurance section
- Reset `isInstructor` to `false` when user switches to `isCertified === false`
- Pass `isInstructor` flag to `submitCertification` or handle role assignment after certification submit

### 2. `src/hooks/useProfile.ts`
- Add optional `isInstructor?: boolean` param to `submitCertification`
- When `isInstructor` is true, upsert role as `"instructor"` instead of `"certified"`
- Update the optimistic cache accordingly

### 3. `src/lib/i18n.ts`
- Add `iAmInstructor`: IT "Sono un Istruttore" / EN "I am an Instructor"

### Technical notes
- The `user_roles` INSERT RLS policy allows `auth.uid() = user_id`, so self-assigning `instructor` role works (same as self-assigning `certified`)
- The instructor checkbox only shows when `isCertified === true` since instructors must be certified

