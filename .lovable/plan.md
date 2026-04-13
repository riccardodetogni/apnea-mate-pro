

# Add "Request Verification" flow for school/club groups

## Overview
Add a button in GroupManage settings tab for `scuola_club` groups to request verification. Admins see pending requests highlighted in the Admin dashboard and can approve/reject.

## Database changes

### 1. Add `verification_requested` column to `groups`
```sql
ALTER TABLE public.groups ADD COLUMN verification_requested boolean NOT NULL DEFAULT false;
```

### 2. Add `group_verification_request` to `notification_type` enum
```sql
ALTER TYPE public.notification_type ADD VALUE 'group_verification_request';
```

## UI changes

### 3. `src/pages/GroupManage.tsx` — Settings tab
- Below the save button, if `group.group_type === 'scuola_club'` and `!group.verified`:
  - Show a "Request Verification" button (or "Verification Requested" disabled state if already requested)
  - On click: update `groups.verification_requested = true`, send notification to all admin users

### 4. `src/hooks/useGroupDetails.ts`
- Include `verification_requested` in the fetched group data and `GroupDetails` interface

### 5. `src/hooks/useAdmin.ts`
- Include `verification_requested` in `AdminGroup` interface and query

### 6. `src/pages/Admin.tsx` — Groups tab
- Show a badge/highlight on groups where `verification_requested = true` and `verified = false`
- Sort these groups to the top of the list
- When admin toggles verification on, also reset `verification_requested = false`

### 7. `src/lib/i18n.ts`
- Add keys: `requestVerification`, `verificationRequested`, `verificationRequestSent`, `pendingVerification` (IT + EN)

## Flow summary
1. Owner creates a `scuola_club` group → goes to Manage → Settings
2. Sees "Request Verification" button → clicks it
3. All admins get a notification with group name
4. Admin opens dashboard → sees group highlighted as "pending verification"
5. Admin toggles verified switch → group becomes verified, flag resets

