
# Plan: Registration Flow & Email Notification Fixes

## Summary
This plan addresses 5 fixes: proper email verification before login, group sessions visibility, settings navigation, email notification expansion, and changing the email sender domain.

---

## Fix Details

### 1. Registration Flow with Email Verification

**Current Behavior**: After registration, users are immediately logged in and redirected to onboarding without email verification.

**Issue**: The `signUp` function in `AuthContext.tsx` does not distinguish between needing email confirmation or not. Currently, Supabase may be configured to auto-confirm users.

**Expected Behavior**:
- After registration, show a confirmation screen asking user to verify their email
- User cannot log in until email is verified
- When user clicks the verification link, they are redirected back to the app

**Files**:
- `src/pages/Auth.tsx` - Add confirmation sent state and UI
- `supabase/config.toml` - Ensure email confirmation is required (handled by Lovable Cloud config)

**Changes**:
1. Add a new state `confirmationSent` to track successful registration
2. After successful `signUp`, show a "Check your email" screen instead of auto-logging in
3. The confirmation email link will redirect to `/` which will trigger the auth state change and proper routing
4. Update the toast message to instruct user to check email

---

### 2. Group Sessions Always Visible

**Current Behavior**: In `useGroupDetails.ts`, sessions are fetched without considering the user's participation status, but the UI may not be showing them.

**Issue**: Looking at the code, sessions ARE being fetched correctly. The issue may be that `GroupSessionsList` receives empty sessions array. Need to verify the sessions query works for non-members.

**Investigation Result**: The sessions query in `useGroupDetails.ts` (lines 112-122) does not filter by user membership - it fetches all active future sessions for the group. The issue may be RLS policies on the sessions table blocking non-members from seeing group sessions.

**Expected Behavior**: Group sessions should be visible to all users viewing the group details page, regardless of membership status.

**Files**:
- Database RLS policies on `sessions` table - may need adjustment for group sessions

**Changes**:
1. Review RLS policy for sessions table
2. If needed, update policy to allow viewing group sessions when viewing the group publicly (unless the group is private and user is not a member)

---

### 3. Back from Settings Goes to Home

**Current Behavior**: In `Settings.tsx`, the back button uses `navigate(-1)` which goes to previous page.

**Expected Behavior**: Back button should always go to `/community` (home).

**File**: `src/pages/Settings.tsx`

**Changes**:
- Change `navigate(-1)` to `navigate("/community")`

---

### 4. Email Notifications for Groups and Certifications

**Current Behavior**: Email notifications only exist for session events (join request, approved, rejected) via the `send-session-notification` edge function.

**Missing Emails**:
- Group join request approved
- Group join request rejected
- Certification approved
- Certification rejected

**Expected Behavior**: Create a new edge function that handles group and certification email notifications.

**Files**:
- `supabase/functions/send-group-notification/index.ts` - New edge function for group emails
- `supabase/functions/send-certification-notification/index.ts` - New edge function for certification emails
- `src/pages/GroupManage.tsx` - Trigger email on approve/reject
- `src/hooks/useAdmin.ts` - Trigger email on certification approve/reject

**Changes**:
1. Create `send-group-notification` edge function with types:
   - `group_request_approved` - notify user their group join was approved
   - `group_request_rejected` - notify user their group join was rejected

2. Create `send-certification-notification` edge function with types:
   - `certification_approved` - notify user their certification was approved
   - `certification_rejected` - notify user their certification was rejected

3. Update `GroupManage.tsx` to call edge function after approve/reject
4. Update `useAdmin.ts` to call edge function after certification approve/reject

---

### 5. Change Email Sender Domain

**Current Behavior**: Edge function uses `noreply@resend.dev` as sender.

**Issue**: For production, emails should come from a verified domain like `noreply@apneamate.it` (or similar verified domain).

**Expected Behavior**: Use Apnea Mate's verified domain for sending emails.

**Files**:
- `supabase/functions/send-session-notification/index.ts`
- `supabase/functions/send-group-notification/index.ts` (new)
- `supabase/functions/send-certification-notification/index.ts` (new)

**Changes**:
1. Change `from: "Apnea Mate <noreply@resend.dev>"` to use verified domain
2. Need to confirm the verified domain with user - add a secret `RESEND_FROM_EMAIL` or use a constant

**Note**: The user needs to verify a domain in Resend dashboard before this can work. Will add a configurable `RESEND_FROM_EMAIL` secret.

---

## Technical Details

### Registration Confirmation Screen (Fix 1)

```typescript
// In Auth.tsx after handleSubmit for register
const [confirmationSent, setConfirmationSent] = useState(false);

// After successful signUp:
setConfirmationSent(true);
toast({
  title: "Controlla la tua email",
  description: "Ti abbiamo inviato un link per confermare il tuo account",
});

// New UI state showing confirmation message
if (confirmationSent) {
  return (
    <div className="...">
      <Mail className="w-16 h-16 text-primary" />
      <h1>Controlla la tua email</h1>
      <p>Ti abbiamo inviato un link di conferma a {email}</p>
      <Button onClick={switchToLogin}>Torna al login</Button>
    </div>
  );
}
```

### Group Notification Edge Function (Fix 4)

```typescript
interface GroupNotificationRequest {
  type: "request_approved" | "request_rejected";
  groupId: string;
  userId: string;
}

// Handler fetches group name, user profile
// Sends appropriate email template
```

### Certification Notification Edge Function (Fix 4)

```typescript
interface CertificationNotificationRequest {
  type: "approved" | "rejected";
  userId: string;
  newRole?: string; // for approved
  reason?: string;  // for rejected
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Fix 1: Add confirmation sent state and UI |
| `src/pages/Settings.tsx` | Fix 3: Navigate to /community on back |
| `supabase/functions/send-session-notification/index.ts` | Fix 5: Update sender email |
| `supabase/functions/send-group-notification/index.ts` | Fix 4: NEW - Group email notifications |
| `supabase/functions/send-certification-notification/index.ts` | Fix 4: NEW - Certification email notifications |
| `src/pages/GroupManage.tsx` | Fix 4: Call group notification function |
| `src/hooks/useAdmin.ts` | Fix 4: Call certification notification function |

---

## Database Changes (if needed)

For Fix 2, may need to verify RLS policies on sessions table allow public viewing of group sessions. Will check during implementation.

---

## Secrets Required

A new secret `RESEND_FROM_EMAIL` should be added with the verified domain email (e.g., `noreply@apneamate.com`). If not set, will fallback to `noreply@resend.dev` for development.

---

## Summary

| Fix | Complexity | Estimated Changes |
|-----|------------|-------------------|
| Email verification flow | Medium | ~50 lines in Auth.tsx |
| Group sessions visibility | Low | RLS review/update |
| Settings back button | Trivial | 1 line |
| Group/Cert email notifications | High | ~200 lines (2 new edge functions + integrations) |
| Email sender domain | Low | ~10 lines across edge functions |

Total: 5 fixes affecting 7 files + 2 new edge functions
