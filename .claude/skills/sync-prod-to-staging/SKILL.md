---
name: sync-prod-to-staging
description: Align this STAGING repo (staging-apneamate) with the prod repo after hotfixes were made directly on prod. Overlay-based code sync — the two repos share no git history. Handles env-file protection, migration reconciliation by content, and build verification.
---

# Sync prod → staging (staging-apneamate)

Reverse of prod's `.claude/skills/promote-staging-to-prod/SKILL.md`. Run from THIS repo.
The repos are separate Lovable Cloud projects with **unrelated git histories** — never merge; overlay.

## Critical environment facts (verify they still hold)
- STAGING ref `ytykfvwrxtsmammaswnz`, PROD ref `vjvhaegbfjepysptcygz`. Remote `prod` → apnea-mate-pro.
- Migration timestamps differ between projects for the same logical migration — reconcile by SQL **content**, never by version.
- Schema changes apply only via Lovable chat → "apply this migration" → Approve (no dashboard, no external DDL). Lovable then regenerates `types.ts`.
- Prod-only, never bring to staging: `supabase/functions/setup-analytics-user/`, the `analytics_rw` migration, `.claude/skills/promote-staging-to-prod/`.
- Staging-only, keep: `bi_*` views in `types.ts`; staging's own migration files.
- Known oddity: staging `.env` has non-VITE `SUPABASE_URL` pointing at prod — unused by the app, leave it.

## Phase 0 — Assess (do NOT skip)
```bash
git fetch prod && git pull --ff-only origin main   # NOT `git fetch prod origin` — that treats "origin" as a refspec and silently fetches nothing
git log --oneline prod/main..main        # staging-only commits: verify each is already IN prod
git tag staging-pre-sync-$(git rev-parse --short main) main
```
Range operators only work within one repo's history — to find "prod commits since last sync",
log from the prod SHA recorded in the last sync commit's message, not from a staging SHA.
If staging has work prod lacks (check by file content, not commit messages — histories are unrelated),
STOP and ask the user: overlay would destroy it.

## Phase 1 — DB delta check (usually empty)
Content-hash migrations on both sides; for prod-only ones, check whether staging already has the
equivalent (formatting-only variants are common — `diff -wB` them). Ground truth for staging's DB
is its generated `src/integrations/supabase/types.ts`. If prod has schema staging genuinely lacks,
the SQL must go through Lovable chat on the STAGING project BEFORE pushing code that needs it.

## Phase 2 — Overlay + restore protected files
```bash
git checkout -b chore/sync-from-prod-$(date +%Y%m%d)
git checkout prod/main -- .
git checkout main -- .env src/integrations/supabase/types.ts .lovable/ supabase/migrations/
# drop prod-added migration files (staging owns its own set):
comm -13 <(git ls-tree -r --name-only main -- supabase/migrations | sort) \
         <(git ls-files supabase/migrations | sort) | xargs -r git rm -q -f
git rm -q -rf supabase/functions/setup-analytics-user .claude/skills/promote-staging-to-prod 2>/dev/null
# config.toml: take prod's [functions.*] verify_jwt list but staging's project_id:
sed -i '' 's/^project_id = .*/project_id = "ytykfvwrxtsmammaswnz"/' supabase/config.toml
git add supabase/config.toml
```

## Phase 3 — Safety greps
```bash
git grep --cached -n "vjvhaegbfjepysptcygz"
# ONLY acceptable hits: .env (known oddity) and email-env.ts logo-URL fallback. Anything else = fix it.
git show :supabase/config.toml | head -1   # must be staging project_id
```

## Phase 4 — Verify, commit, push
```bash
npm install --no-audit && npx tsc --noEmit -p tsconfig.app.json && npm run build
git checkout -- package-lock.json          # discard npm-install churn
git commit -m "Sync frontend + edge functions from prod ($(git rev-parse --short prod/main))"
git checkout main && git merge --ff-only chore/sync-from-prod-<date>
git push origin main && git push origin --tags
```
Push triggers the staging Lovable rebuild. Smoke-test whatever prod changed most.

## Rollback
`git reset --hard staging-pre-sync-<sha> && git push --force-with-lease origin main`
