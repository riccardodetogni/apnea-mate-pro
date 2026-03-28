

# Self-Certification: Remove Admin Review, Auto-Approve on Submit

## Summary

Switch from admin-approval to self-certification. When a user submits certification details and accepts the disclaimer, they are immediately marked as "certified" — no pending state, no admin review needed.

## Changes

### 1. `src/hooks/useProfile.ts` — Auto-approve + assign role
- In `submitCertification`, change `status: "pending"` → `status: "approved"` 
- After inserting the certification, upsert `user_roles` with `role: "certified"` for the user
- This makes the user immediately certified upon submission

### 2. `src/components/certification/CertificationForm.tsx` — Same auto-approve
- The form used on the Profile page calls `submitCertification` from the hook, so it inherits the change above
- Update the success toast from "in attesa di approvazione" → "Certificazione aggiunta" (certification added)

### 3. `src/components/certification/CertificationStatus.tsx` — Simplify
- Remove `pending` and `rejected` status configs (no longer reachable)
- Keep `not_submitted` and `approved` only
- Remove `rejectionReason` prop

### 4. `src/pages/Profile.tsx` — Simplify certification section
- Remove the `CertificationStatusBadge` pending/rejected display
- Show either "Certificato" badge (if certified) or the "Submit certification" button
- Remove rejected re-submit logic (no rejections anymore)

### 5. `src/pages/Admin.tsx` — Remove "Pending Certifications" tab
- Remove the entire `pending` tab content (approve/reject dialogs, document preview)
- Keep Users and Groups tabs
- Remove the approve/reject certification dialogs and handlers

### 6. `src/hooks/useAdmin.ts` — Remove certification approval logic
- Remove `fetchPendingCertifications`, `approveCertification`, `rejectCertification` functions
- Remove `pendingCertifications` state
- Keep `fetchAllUsers`, `fetchAllGroups`, `updateUserRole`, `toggleGroupVerification`

### 7. `src/pages/Onboarding.tsx` — No code change needed
- Already calls `submitCertification` which will now auto-approve

### 8. `src/lib/i18n.ts` — Update strings
- Remove/update `certStatusPending`, `certStatusRejected` keys
- Update `submitCertification` text to reflect immediate activation

### 9. Edge function `send-certification-notification` — Can be kept but won't be called
- No changes strictly needed; it simply won't be invoked anymore since there's no approve/reject flow

## What stays unchanged
- `CertificationBadge` component (still shows "Certificato" badge)
- `useUserProfile.ts` role logic (reads from `user_roles`, still works)
- Session join/host permissions (still based on `isCertified` from role)
- The disclaimer checkbox in onboarding Step 3 (still required)
- Admin can still manually change user roles via Users tab

