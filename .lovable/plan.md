## Goal

1. Tomorrow, send the launch announcement to every address in `waitlist`, in IT or EN based on the language captured at signup.
2. Stop showing the "Coming Soon" landing — visitors should land on `/auth` so they can register immediately.

---

## Part 1 — Landing page: `/` → `/auth`

- In `src/App.tsx`, change the `/` route from `<ComingSoon />` to a redirect to `/auth` (`<Navigate to="/auth" replace />`).
- `Auth` already handles "already logged in → /community or /onboarding" via existing logic.
- `ComingSoon.tsx` stays in the repo (easy to restore if needed) but is no longer reachable.

---

## Part 2 — Launch email templates

Create two new React Email templates in `supabase/functions/_shared/transactional-email-templates/`, matching the brand styling of existing waitlist templates (navy heading, teal accents, white body, wave logo):

- `launch-announcement-it.tsx` — your Italian copy, subject **"Apnea Mate è aperto 🌊 Entra nella prima ondata"**.
- `launch-announcement-en.tsx` — English translation, subject **"Apnea Mate is live 🌊 Join the first wave"**.

Each template:
- No required props (we don't store names on waitlist).
- CTA button → `https://apneamate.com`.
- Closes with the `Connect. Dive. Explore.` tagline.
- The unsubscribe footer is appended automatically by the email infra — we do not add one.

Register both in `registry.ts` under `launch-announcement-it` and `launch-announcement-en`.

---

## Part 3 — Capture language on waitlist

Migration:
- Add `language text not null default 'it' check (language in ('it','en'))` to `public.waitlist`.
- Existing rows default to `'it'` (the vast majority of signups so far).

Update `ComingSoon.tsx`'s waitlist insert to also write `language` from `useLanguage()` so any future signups are tagged correctly.

---

## Part 4 — One-shot launch sender (admin-only edge function)

New: `supabase/functions/send-launch-announcement/index.ts`.

Behavior:
1. Validates the caller's JWT and checks `has_role(uid, 'admin')`. 403 otherwise.
2. Body: `{ dryRun?: boolean, limit?: number }` for safe testing.
3. Reads `waitlist` with the service role, paginated by 200, ordered `created_at asc`.
4. For each row, invokes `send-transactional-email` with:
   - `templateName: 'launch-announcement-' + (row.language ?? 'it')`
   - `recipientEmail: row.email`
   - `idempotencyKey: 'launch-2026-05-22-' + row.id` → safe to re-run; duplicate addresses are a no-op.
5. The existing pgmq dispatcher handles rate-limit backoff, retries, suppression, DLQ. No extra throttling needed.
6. Returns `{ totalRows, enqueued, skipped, errors, byLanguage }`.

Deploy alongside the new function block in `supabase/config.toml`.

---

## Part 5 — Triggering the send tomorrow

Sequence I recommend tomorrow:
1. **Dry run** (`dryRun: true`) — confirms total count + IT/EN split, sends nothing.
2. **Test send** — temporarily add your own email to `waitlist`, run with `limit: 1` filtering to that row, verify rendering in your inbox.
3. **Full run** — fires off everyone. Because of idempotency keys, accidentally running it twice is harmless.

You can trigger from Lovable chat ("send the launch email") or via `curl` with your admin JWT — I'll include the exact command in the implementation summary.

---

## Files touched

```text
src/App.tsx                                                    route → redirect /
src/pages/ComingSoon.tsx                                       insert .language
supabase/migrations/<new>.sql                                  waitlist.language column
supabase/functions/_shared/transactional-email-templates/
  launch-announcement-it.tsx                                   new
  launch-announcement-en.tsx                                   new
  registry.ts                                                  register both
supabase/functions/send-launch-announcement/index.ts           new
supabase/functions/send-launch-announcement/deno.json          new
supabase/config.toml                                           register new function
```

No changes to existing transactional functions, auth hook, queue, or DB infra.

---

## Why this is OK as a "transactional" send

This is a one-shot launch announcement to people who explicitly signed up to a waitlist *for exactly this moment* — recipient-initiated, recipient-expected, fired once per address. It is not a newsletter and not a recurring campaign. Suppression list, unsubscribe footer, and DLQ are all honored automatically.

Confirm and I'll implement.
