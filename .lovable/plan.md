## Goal

Export production data as downloadable `.sql` files (one per table) ready to be imported into the staging DB. Anonymize emails for everyone except the 5 whitelisted UUIDs. Skip messaging, notifications, feedback, waitlist, and all email/suppression tables.

## Tables included (19)

`profiles`, `user_roles`, `certifications`, `spots`, `spot_favorites`, `groups`, `group_members`, `group_tags`, `sessions`, `session_participants`, `courses`, `course_participants`, `events`, `event_participants`, `event_schedule`, `follows`, `reviews`, `personal_bests`, `training_presets`.

## Tables excluded (per your request)

`messages`, `conversations`, `conversation_participants`, `notifications`, `feedback`, `waitlist`, `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`.

## Email anonymization (only affects `profiles`)

Whitelist (kept as-is):
- `6049c4b1-0656-4fe5-ba41-f9ba84cb0247`
- `06904323-1bf5-4a25-8223-8e86a4b951eb`
- `3f5b72d1-48dd-44d9-bfa0-4765e0997631`
- `3927f428-a5f1-4e4c-aca9-de3eb2824f27`
- `da3a09f8-a983-4a46-92a5-bd0d484d7044`

(You wrote "4 UUIDs" but listed 5 — I'll treat all 5 as whitelist. Confirm if wrong.)

Everyone else gets `user-<short_uuid>@staging.local`. The `name` / `last_name` fields are left untouched (you only asked about emails).

## Output format

- One file per table: `/mnt/documents/staging-seed/01_profiles.sql`, `02_user_roles.sql`, … numbered in FK-safe import order (profiles & user_roles first, then spots/groups, then sessions/courses/events, then participants/follows/reviews/etc.).
- Each file: `TRUNCATE ... CASCADE;` (commented out by default) + `INSERT INTO ... VALUES (...), (...);` batches.
- Plus a master `00_import_all.sql` that `\i`-includes them in order.
- Bundled as a downloadable `.zip` artifact and individual `.sql` artifacts.

## Important caveat (please read before I run this)

`profiles.user_id`, `user_roles.user_id`, and every other `user_id` column reference `auth.users` rows that **do not exist on the staging DB**. Inserts will either:

- **fail** if you keep the FK to `auth.users` (Supabase manages that schema, we can't insert there from a seed file), or
- **succeed but orphan** — RLS policies using `auth.uid()` won't match any real session.

Two ways to handle it — tell me which you want:

1. **Skip auth-coupled data**: only export `spots`, `groups`, `group_tags` (the truly shareable reference data). Staging users sign up fresh.
2. **Full export as planned**: I generate everything; on staging you'll need to either (a) recreate the same `auth.users` rows manually with the same UUIDs via the Supabase dashboard / admin API before importing, or (b) accept that the seeded profiles will be "ghost" rows without working logins.

Option 2 is what you asked for literally — just want to be sure you know the auth side won't magically follow.

## Technical details

- Use `supabase--read_query` to pull each table.
- Python script writes properly escaped SQL (handles NULLs, JSONB, timestamps, numerics, UUIDs).
- Output goes to `/mnt/documents/staging-seed/` and surfaces as `<presentation-artifact>` downloads.

## Confirm before I execute

1. Option 1 or Option 2 above?
2. The 5-UUID whitelist is correct?
3. OK to leave names/bios untouched, anonymize only emails?
