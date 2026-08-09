End-of-day cleanup for chat email notifications

## Goal
Make chat unread email notifications reset at the end of each day (Europe/Rome), so a new message on a new day reliably triggers a new notification — even if the user never read the previous day's messages.

## Current behavior
- The `process-chat-email-notifications` Edge Function runs every minute via `pg_cron`.
- It sends one email per conversation/recipient cycle and sets `last_emailed_at` on the pending row.
- A sliding 24-hour housekeeping query already deletes rows where `last_emailed_at < now - 24h`.
- Because this is a sliding window, a message sent late in the evening can block new notifications for most of the next morning.

## Proposed change
Add an end-of-day cleanup step inside the existing `process-chat-email-notifications` Edge Function that runs on every invocation.

- Delete rows where `last_emailed_at` is before the start of the current day in `Europe/Rome`.
- Keep the existing 24-hour safety cleanup unchanged.
- The dispatcher logic that only sends rows with `last_emailed_at IS NULL` stays the same.

## Result
- A user receives at most one email per active conversation per day (if they do not read the chat).
- After midnight Europe/Rome, a new message in the same conversation starts a fresh notification cycle.
- The existing 24-hour fallback still removes old rows if the daily cleanup were ever to miss a day.

## Implementation steps
1. Update `supabase/functions/process-chat-email-notifications/index.ts` to add an end-of-day cleanup query after the existing housekeeping query.
2. Compute the start of today in `Europe/Rome` and delete sent rows older than that timestamp.
3. Include the deleted count in the function response for observability.
4. Deploy the updated Edge Function with `supabase--deploy_edge_functions`.

## No database migration needed
The `pending_chat_email_notifications` schema already has the columns and indexes required. Only the Edge Function code changes.
