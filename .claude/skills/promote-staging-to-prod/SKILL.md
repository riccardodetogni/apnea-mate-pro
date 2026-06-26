---
name: promote-staging-to-prod
description: Port staging changes into the apnea-mate-pro PROD repo (Lovable Cloud + Supabase). Use when promoting the staging-apneamate remote's changes to production — handles code, schema migrations via Lovable's approval flow, storage, and a safe rollback path.
---

# Promote staging → prod (apnea-mate-pro)

A playbook for porting accumulated `staging` changes into the **prod** Lovable Cloud project.
Follow phases in order. Do NOT skip the assessment or the env-file restore — those are the
two steps that bite. Confirm with the user before any irreversible/outward step (push, migration apply).

## Critical environment facts (verify they still hold)
- **Two separate Lovable Cloud projects.** PROD ref `vjvhaegbfjepysptcygz`, STAGING ref `ytykfvwrxtsmammaswnz`.
  Because they're separate projects, **migration version timestamps differ by 1–2s for the "same" logical
  migration** — never reconcile migrations by version number; reconcile by SQL *content*.
- **No Supabase dashboard / no dashboard SQL editor. No external DDL connection.**
  - Schema changes: paste SQL into **Lovable chat → "apply this migration" → Approve**. Lovable then
    auto-writes the migration file AND regenerates `src/integrations/supabase/types.ts` into the repo.
  - Hand-committed migration files do NOT auto-run. The `analytics_rw` DBeaver role is read/data only (no DDL).
  - Read-only SELECTs for inspection are fine via DBeaver/`analytics_rw`.
- Edge functions, secrets, storage buckets, auth settings are managed through Lovable's UI on publish.
- `staging` is a git remote on this repo. `git fetch staging` first.

## Phase 0 — Assess & protect
```bash
git fetch staging origin
git log --oneline main..staging/main | wc -l                 # how much to port
git diff --stat main staging/main                            # tree distance
git tag prod-pre-promote-$(printf %s "$(git rev-parse --short main)") main   # code rollback point
```
Back up: prod has **real user data**; Lovable takes daily backups (the user accepts that as the safety net).
A bad migration = restore to yesterday, losing a day — flag this, don't silently rely on it.

## Phase 1 — Port code into a branch (overlay, do NOT `git rm`)
```bash
git checkout -b chore/port-staging-<date>
git checkout staging/main -- .        # overlay staging tree (keeps prod-only files like analytics)
```
Do **not** run `git rm -r .` first — that drops prod-only files (e.g. `setup-analytics-user`,
the `analytics_rw` migration). Overlay is safer here.

## Phase 2 — Restore prod env-specific files (THE classic mistake)
Staging values must not overwrite prod's:
```bash
git checkout main -- .env supabase/config.toml src/integrations/supabase/client.ts
git grep --cached -n "ytykfvwrxtsmammaswnz"   # MUST be empty (no staging ref staged)
```
- `.env`: `VITE_SUPABASE_*` must be the PROD ref (else the prod frontend talks to staging DB).
- `supabase/config.toml`: prod's `project_id` + prod's (more complete) `[functions.*] verify_jwt` list.
  Staging's is often stripped and would break `auth-email-hook` / unsubscribe handlers.

## Phase 3 — Classify & neutralize migrations
List what the port ADDS:
```bash
comm -13 <(git ls-tree -r --name-only main -- supabase/migrations | sort) \
         <(git ls-tree -r --name-only staging/main -- supabase/migrations | sort)
```
Scan every added migration for destructive ops and CLASSIFY each:
```bash
git grep -niE "truncate|delete from|drop (table|column|policy)|alter .*type|insert into storage.buckets" -- supabase/migrations/2026*.sql
```
- **🚨 Destructive staging data ops** (e.g. `TRUNCATE … CASCADE`, `DELETE FROM auth.users` keeping seed UUIDs):
  these are STAGING-only resets. Neutralize the file to a `SELECT 1; -- no-op` with a comment, or exclude it.
  NEVER apply to prod.
- **Schema/RLS/function changes the app needs** → apply (Phase 4).
- **Analytics/BI cluster** (analytics schema, `bi_*` views, `bi_reader`/`data_editor` roles; note hardcoded
  role passwords — flag to rotate) → usually skip unless explicitly wanted on prod.
- **Email/queue infra** → prod may already have it (`pgmq`/`pg_cron`/`enqueue_email`). Verify before touching.

## Phase 4 — Apply needed migrations via Lovable chat
Inspect prod first (read-only) to gate risky changes:
```sql
-- statuses must be subset of any new CHECK; functions/constraints RLS depends on must exist
select version from supabase_migrations.schema_migrations order by version desc limit 25;
```
Then, for each needed migration **in dependency order**, paste its SQL into Lovable chat,
say "apply this migration", and have the user Approve. Make one-line DDL idempotent
(`ADD COLUMN IF NOT EXISTS`). Lovable writes the file + regenerates `types.ts` per approval.

## Phase 5 — Reconcile the branch (after Lovable wrote its own migration files)
Lovable committed new migration files (prod-dated) + a regenerated `types.ts` to `main`.
Build the final push branch = current main + the frontend/function changes, WITHOUT staging's
migration files or `types.ts`:
```bash
git checkout main && git pull
git checkout -b promote-staging-code
git checkout chore/port-staging-<date> -- .                 # overlay all ported changes
git checkout main -- src/integrations/supabase/types.ts     # keep Lovable's regenerated types
# remove staging's migration files (Lovable owns the applied ones; the rest aren't wanted):
comm -23 <(git ls-files supabase/migrations | sort) \
         <(git ls-tree -r --name-only main -- supabase/migrations | sort) | xargs git rm -f
# verify parity:
git diff --name-only main -- supabase/migrations/ src/integrations/supabase/types.ts   # must be empty
git diff --stat main                                        # only frontend + edge functions
git grep -n "ytykfvwrxtsmammaswnz" -- . ':!*.lockb'         # must be empty
git commit -m "Promote staging frontend + edge functions to prod"
```

## Phase 6 — Out-of-SQL pieces
- **Storage buckets**: confirm needed buckets exist (`select id from storage.buckets where id='<bucket>'`).
  The app uses `covers` (and `avatars`, `certifications`, `email-assets`). Create missing ones + RLS via
  Lovable chat (bucket SQL with `ON CONFLICT (id) DO NOTHING` + `DROP POLICY IF EXISTS`/`CREATE POLICY`).
- **Edge function secrets**: list with
  `git grep -hoE "Deno\.env\.get\(['\"][A-Z_]+['\"]\)" -- 'supabase/functions/**/*.ts' | sort -u`.
  `SUPABASE_*` and `LOVABLE_*` are auto-injected by Lovable Cloud. Verify any custom ones
  (e.g. `ANALYTICS_RW_PASSWORD`, `LOVABLE_SEND_URL`) exist in Lovable's settings.
- **Auth settings** (site URL, redirects, templates): mirror staging in Lovable's prod UI if changed.

## Phase 7 — Deploy & smoke test (irreversible — confirm with user)
Re-tag the real rollback point (main has moved past the Phase-0 tag due to Lovable's migration commits):
```bash
git tag prod-pre-frontend-push main
git checkout main && git merge --ff-only promote-staging-code && git push origin main
```
Push syncs to Lovable → rebuilds frontend + redeploys edge functions. Ensure the prod Lovable
project isn't mid-edit. Smoke-test in priority order: **email** (highest risk if functions changed),
auth/login, the specific new features, storage uploads.

## Rollback
- **Code**: `git reset --hard prod-pre-frontend-push && git push --force-with-lease origin main`
  (reverts frontend+functions; applied migrations stay — they're additive/idempotent).
- **DB**: restore from Lovable's daily backup (last resort; loses up to a day).
