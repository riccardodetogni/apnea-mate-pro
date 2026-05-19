## Problem
After a user confirms their email, Supabase redirects them to `/` (the value of `emailRedirectTo` in `signUp`). The `/` route renders `ComingSoon`, which unconditionally sends any authenticated user to `/community`. The profile-completeness check that decides between `/community` and `/onboarding` only exists in `Auth.tsx`, so confirmed users skip onboarding (and miss the privacy/safety disclaimers).

## Fix
Send confirmed users through `/auth` so the existing profile check runs and routes them to `/onboarding` or `/community` correctly.

### 1. `src/contexts/AuthContext.tsx`
Change the `signUp` redirect target from `/` to `/auth`:
```ts
const redirectUrl = `${window.location.origin}/auth`;
```
This way the email confirmation link lands on `/auth`, which already has the profile-existence logic in its `useEffect`.

### 2. `src/pages/ComingSoon.tsx` (defensive)
Currently does `if (user) return <Navigate to="/community" replace />`. Replace with a small async profile check (same logic as `Auth.tsx`): if `profile.location` is set → `/community`, else → `/onboarding`. This protects any user who is already logged in and revisits `/` directly.

Reuse the same query pattern already used in `Auth.tsx` (select `name, location` from `profiles` by `user_id`) to keep behavior identical.

## Out of scope
- The Auth.tsx privacy-checkbox addition discussed earlier (separate task).
- Any change to the email template itself — the link works, only the destination logic is wrong.

## Verification
- Register a fresh test email → click confirmation link → should land on `/onboarding` (not `/community`).
- Re-open `/` while logged in with a completed profile → should land on `/community`.
- Re-open `/` while logged in with an incomplete profile → should land on `/onboarding`.