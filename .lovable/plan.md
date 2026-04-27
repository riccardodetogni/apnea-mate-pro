## Problem

When a user requests to join a group, the group owner/admins receive **no notification** (neither in-app bell nor email). They only find out by manually opening the group's manage page. Sessions already do this correctly via `createNotification()` + `send-session-notification` edge function — groups are missing the equivalent.

## Solution

Mirror the session join-request pattern for group joins.

### 1. `src/hooks/useGroups.ts` — `joinGroup()`

After the successful `group_members` insert, when `status === 'pending'`:

- Look up all group owners/admins (`group_members` where `group_id = X` and `role IN ('owner','admin')` and `status = 'approved'`), and also include `groups.created_by` as a fallback.
- For each owner, call `createNotification({ type: 'group_join_request', ... })` with the requester's name and group name in title/message + metadata `{ group_id, group_name, user_id, user_name }`.
- Also `supabase.functions.invoke('send-group-notification', { body: { type: 'request_received', groupId, ownerId, requesterId } })` to send an email.

The notification type `group_join_request` already exists in `src/lib/notifications.ts` and the `notifications` enum, so no DB migration is needed.

### 2. `supabase/functions/send-group-notification/index.ts`

Add a new branch `type: 'request_received'` that:
- Fetches the group, the owner's email (recipient), and the requester's profile name.
- Sends an Italian email: subject `"Nuova richiesta di adesione a "<group>""`, body with requester name + CTA button "Gestisci richieste" linking to `https://apnea-mate-pro.com/groups/<groupId>/manage` (the existing GroupManage route).

The function already has CORS, Resend setup, and the `request_approved` / `request_rejected` patterns to copy from.

### 3. NotificationBell / NotificationsDrawer

Verify the existing components already render `group_join_request` notifications (they should, since the type predates this fix). If the click handler doesn't route group notifications anywhere useful, add navigation to `/groups/<group_id>/manage` for `group_join_request`.

## Out of scope

- Notifications for non-approval-required groups (auto-join) — owner doesn't need to act, so no notification is sent.
- Owner-side approve/reject flow for group requests (already exists in GroupManage and already sends `request_approved` / `request_rejected` emails).

## Files touched

- `src/hooks/useGroups.ts` (add notification dispatch after pending insert)
- `supabase/functions/send-group-notification/index.ts` (new `request_received` type)
- `src/components/notifications/NotificationItem.tsx` (only if click routing for group requests is missing)
