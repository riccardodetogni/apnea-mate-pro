# Register & logbook notifications

## What exists today

- `signature_request` — sent to the instructor when a diver asks for a signature (created inside the signing RPC).
- `signature_reminder` — daily background job for registers older than 3 days with unsigned entries, plus the manual "remind" button in the register's libretti page.

Nothing tells the diver when their entry is signed, when a register is closed, or when an entry is created for them automatically.

## What to add (in-app only)

1. **Entry signed** — the diver gets a notification as soon as an instructor signs their logbook entry, for every signing path (mass signing from the register, group signing, requested signing, QR). Self-signing by the same person produces no notification.
2. **Register closed** — every participant with an account who was present on the register is notified that their logbook entry is now final and no longer editable.
3. **Entry created automatically** — when joining a session/event creates a logbook entry for a diver, they are notified so they can complete depth, times and notes. No notification when the diver created the entry themselves.

Each notification opens the relevant logbook entry when tapped; the register-closed one opens the entry too, falling back to the logbook list.

## Technical notes

- Extend the `notification_type` enum with `dive_log_signed`, `register_closed`, `dive_log_created`.
- Notifications are produced by database triggers so every path is covered without duplicating logic in the app:
  - `AFTER INSERT ON dive_log_signatures` → notify the entry owner, skipped when `verifier_user_id = owner`. Metadata: `dive_log_id`, verifier name, register id when available.
  - `AFTER UPDATE ON dive_registers` when `status` becomes `chiuso` (and was not before) → one notification per present participant with a non-null `user_id`, excluding the closer. Metadata: `register_id`, `dive_log_id`.
  - `AFTER INSERT ON dive_logs` where `register_id IS NOT NULL` and `user_id <> auth.uid()` (covers the existing autolog trigger and the session/event sync triggers). Metadata: `dive_log_id`, `register_id`.
  - All functions `SECURITY DEFINER` with `SET search_path = public`, inserting into `public.notifications` directly (same pattern as `request_log_signature`).
- Frontend: add the three types to `NotificationType` in `src/lib/notifications.ts`, to `iconMap` in `NotificationItem.tsx` (signature = `PenSquare` green, closed = `Lock` amber, created = `FilePlus` blue), and extend `NotificationsDrawer.tsx` routing so the new types resolve `metadata.dive_log_id` → `/logbook/:id`, else `/logbook`.
- Titles/messages are generated in the trigger in Italian, matching the existing `signature_request` wording style.
