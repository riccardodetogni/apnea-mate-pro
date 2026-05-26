## Goal
Add a creator-only **Delete** action to Session, Group, Event, and Course detail screens, with per-type confirmation dialogs, full cascade cleanup, in-app notifications to affected users, and creator-only enforcement at the database level.

## Scope
- 4 detail screens: `SessionDetails`, `GroupDetails`, `EventDetails`, `CourseDetails`.
- No changes to list/feed cards (no inline delete).
- Existing "Cancel session" flow in `SessionDetails` stays as-is (sets status to `cancelled`). **Delete** is a separate, harder action that removes the record entirely.

---

## 1. Database — security-definer RPCs

Create 4 Postgres functions (SECURITY DEFINER, `SET search_path = public`). Each verifies `auth.uid() = created_by/creator_id` and raises `insufficient_privilege` otherwise. This is the security layer — UI hiding is only cosmetic.

- `delete_session_cascade(_session_id uuid)`
  1. Check creator. 2. Delete from `session_participants`. 3. Delete from `sessions`.
- `delete_event_cascade(_event_id uuid)`
  1. Check creator. 2. Delete from `event_participants`, `event_schedule`. 3. Delete from `events`.
- `delete_course_cascade(_course_id uuid)`
  1. Check creator. 2. Delete from `course_participants`. 3. Delete from `courses`.
- `delete_group_cascade(_group_id uuid)`
  1. Check `created_by`. 2. `UPDATE sessions SET group_id = NULL WHERE group_id = _group_id`. 3. Same for `courses` and `events`. 4. Delete from `group_members`, `group_tags`. 5. Delete from `groups`.

Each function returns the list of affected user IDs (participants / members) so the client can fan out notifications. Signature: `RETURNS TABLE(user_id uuid, title text)`.

Granted to `authenticated` only.

Existing RLS DELETE policies on `sessions`, `events`, `courses`, `groups` already restrict to creator — kept as-is for defense in depth.

## 2. Shared UI — confirm dialog

Use existing `AlertDialog` component. Add a small helper component `DeleteConfirmDialog` under `src/components/common/` taking `{ open, onOpenChange, title, description, onConfirm, loading }` to avoid duplicating the 4 dialog blocks. Destructive button uses `variant="destructive"`.

## 3. Per-screen integration

In each detail page, add a `⋮` button (lucide `MoreVertical`) in the header next to the existing Edit/Manage/Share buttons, **rendered only when `isCreator`**. Tap opens a `DropdownMenu` with a single red item "Elimina" (lucide `Trash2`). Selecting it opens the confirmation dialog.

### SessionDetails
- Header: add ⋮ menu near the existing Edit (`pencil`) button (line ~398).
- Dialog copy: "Elimina sessione" / "Sei sicuro di voler eliminare questa sessione? I partecipanti verranno notificati della cancellazione. Questa azione è irreversibile."
- On confirm: snapshot `session.participants` (status `confirmed` or `pending`), call `supabase.rpc("delete_session_cascade", { _session_id: id })`. On success: loop `createNotification` (type `session_cancelled`, same wording as the existing cancel flow). Navigate to `/community`.

### GroupDetails
- Header: add ⋮ menu near the existing "Gestisci" button (line ~133), gated on `group.is_owner`.
- Dialog copy: "Elimina gruppo" / "Sei sicuro di voler eliminare questo gruppo? I membri verranno rimossi dal gruppo. Le sessioni e i corsi associati non verranno eliminati e rimarranno visibili come contenuti indipendenti. Questa azione è irreversibile."
- Snapshot member user_ids (status approved + pending) from `useGroupDetails.members` before deletion.
- On confirm: call `supabase.rpc("delete_group_cascade", { _group_id: id })`. Notifications use a new notification type `group_deleted` (add to enum) with message "Il gruppo \"{name}\" è stato eliminato". Navigate to `/groups`.

### EventDetails
- Header: add ⋮ menu next to existing Edit button (line ~258).
- Dialog copy: "Elimina evento" / "Sei sicuro di voler eliminare questo evento? I partecipanti verranno notificati della cancellazione. Questa azione è irreversibile."
- Snapshot event_participants (confirmed + pending) via a quick `supabase.from('event_participants').select('user_id').in('status', [...])` before deletion.
- Call `supabase.rpc("delete_event_cascade", ...)`. Notifications: new type `event_cancelled` with metadata `{ event_id, event_title }`. Navigate to `/community`.

### CourseDetails
- Header: add ⋮ menu next to existing Edit button (line ~242).
- Dialog copy: "Elimina corso" / "Sei sicuro di voler eliminare questo corso? I partecipanti iscritti verranno notificati. Questa azione è irreversibile."
- Snapshot course_participants similarly.
- Call `supabase.rpc("delete_course_cascade", ...)`. Notifications: new type `course_cancelled`. Navigate to `/community`.

## 4. Notification types

Extend the `notifications.type` Postgres enum and `NotificationType` in `src/lib/notifications.ts` with:
- `session_cancelled` (already used in `createNotification` calls; verify it exists in the enum, add if missing)
- `event_cancelled`
- `course_cancelled`
- `group_deleted`

## 5. Error handling
- Wrap RPC call in try/catch. On error: `toast({ title: "Errore", description: "Impossibile eliminare. Riprova più tardi.", variant: "destructive" })`. Stay on the page, keep dialog closable.
- If RPC raises `insufficient_privilege` (user bypassed UI via direct call): toast "Non hai i permessi per eliminare questo contenuto."

## 6. Files touched

**New**
- `supabase/migrations/<ts>_add_delete_cascade_rpcs.sql` — 4 functions + enum additions.
- `src/components/common/DeleteConfirmDialog.tsx`.

**Edited**
- `src/pages/SessionDetails.tsx` — add ⋮ menu, dialog, handler.
- `src/pages/GroupDetails.tsx` — same.
- `src/pages/EventDetails.tsx` — same.
- `src/pages/CourseDetails.tsx` — same.
- `src/lib/notifications.ts` — add new `NotificationType` values.

## Notes
- Notifications are fired client-side after a successful RPC (consistent with the existing cancel-session flow). If the user closes the tab mid-fan-out some notifications may be missed; acceptable for v1 given existing patterns.
- "Cancel session" (status flip) and "Delete session" coexist; the menu item is labelled "Elimina" to distinguish.
