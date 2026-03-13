

## Notification System Analysis

### Identified Bugs and Missing Notifications

#### BUG 1 (Critical): Community page join does NOT send any notification
When a user joins a session from the **Community feed** (`Community.tsx`), the `confirmJoinSession` function calls `joinSession()` from `useSessions.ts`, which only inserts into `session_participants` and returns. **No `createNotification()` is called, and no email is sent.** The session creator has no idea someone requested to join.

Compare with `SessionDetails.tsx` and `SpotDetails.tsx`, which both correctly call `createNotification()` + `send-session-notification` edge function after a successful join.

This is the main reason notifications "sometimes arrive, sometimes don't" -- it depends on which screen the user joins from.

#### BUG 2: Group rejection does NOT create in-app notification
In `GroupManage.tsx`, `handleReject` sends an email via `send-group-notification`, but does **not** call `createNotification()`. The rejected user gets no in-app notification (only email, if Resend works).

#### BUG 3: Session cancellation does not notify pending participants
In `SessionDetails.tsx`, `handleCancelSession` only notifies `confirmed` participants. Pending participants are silently dropped with no notification.

#### BUG 4: No notification when a user leaves/cancels their own participation
When a user cancels their pending request or leaves a session, the creator receives no notification about it.

#### BUG 5: Community page group join sends no notification
In `Community.tsx`, `handleJoinGroup` has a `// TODO: Implement request-based join` comment. Even for non-approval groups, no notification is sent to the group owner.

### Architecture Concerns

1. **Notification logic is scattered** across 5 different files (SessionDetails, SpotDetails, Community, GroupDetails, GroupManage). The `joinSession` in `useSessions.ts` is a dumb DB insert with no side effects, but the calling pages inconsistently add notifications on top.

2. **No error feedback** if `createNotification()` fails -- the error is logged but the user has no idea the notification wasn't sent.

### Proposed Fix

**Centralize notification sending into `useSessions.ts` and `useGroups.ts` hooks** so that every join path automatically triggers notifications, regardless of which page initiates it.

#### Changes:

**1. `src/hooks/useSessions.ts`** -- Enhance `joinSession()` to also create the in-app notification and invoke the email edge function after a successful insert. This ensures Community, SessionDetails, and SpotDetails all get consistent behavior.

**2. `src/pages/SessionDetails.tsx`** -- Remove the duplicate notification logic from `confirmJoin` (now handled by the hook). Keep approve/reject/cancel notification logic here since those are only triggered from this page.

**3. `src/pages/SpotDetails.tsx`** -- Remove duplicate notification logic from `confirmJoin` (now handled by the hook). Refactor to use the shared `joinSession` from useSessions instead of raw Supabase insert.

**4. `src/pages/Community.tsx`** -- No changes needed (will automatically get notifications via the enhanced hook).

**5. `src/pages/GroupManage.tsx`** -- Add missing `createNotification()` call for group rejection.

**6. `src/pages/SessionDetails.tsx`** -- Fix cancellation to also notify **pending** participants.

**7. `src/pages/SessionDetails.tsx`** -- Add notification to creator when a participant **leaves** a session.

### Files to modify
1. `src/hooks/useSessions.ts` -- centralize join notification logic
2. `src/pages/SessionDetails.tsx` -- remove duplicate notification on join, fix cancel to include pending, add leave notification
3. `src/pages/SpotDetails.tsx` -- remove duplicate notification on join, use shared hook
4. `src/pages/Community.tsx` -- remove redundant join logic (already uses hook)
5. `src/pages/GroupManage.tsx` -- add missing rejection in-app notification

