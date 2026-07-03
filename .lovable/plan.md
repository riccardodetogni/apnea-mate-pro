## Diagnosis

Rechecking the situation — I was wrong in the previous turn:

- The workspace has 3 verified domains: `apneamate.com`, `apnea-mate-pro.com`, `staging.apneamate.com`.
- The project's email is actually configured on **`notify.apneamate.com`** — a subdomain of `apneamate.com` that Lovable manages via NS delegation (`ns3/ns4.lovable.cloud`). That's where SPF/DKIM (`pdk1._domainkey`) actually live and where Mailgun signs from.
- `notify.apneamate.com` is **not being introduced by mistake** — it's the correct verified sending subdomain. This is exactly how Lovable Emails is designed: delegate a subdomain, manage DKIM/SPF there, keep the root clean.

**The actual bug** is in `supabase/functions/_shared/email-env.ts`: it defaults `SENDER_DOMAIN` (used for Mailgun API domain lookup) to the root `apneamate.com`, but the verified/DKIM-signed domain is `notify.apneamate.com`. No `EMAIL_SENDER_DOMAIN` / `EMAIL_FROM_DOMAIN` secrets are set to override the defaults. This is why headers show `dkim=permerror` + `spf=none`: emails are submitted against the wrong Mailgun domain.

Also noted: leftover secrets `RESEND_API_KEY` and `RESEND_FROM_EMAIL` from a previous Resend setup. Not referenced by any current code.

## What the values should be

| Constant | Purpose | Correct value |
|---|---|---|
| `SENDER_DOMAIN` | Mailgun API domain — must match the verified/DKIM-signed subdomain | `notify.apneamate.com` |
| `FROM_DOMAIN` | Visible From address domain in the inbox | `apneamate.com` (users see `noreply@apneamate.com`) |
| `ROOT_DOMAIN` | Used for links in email templates | `apneamate.com` |

Inbox result: From = `Apnea Mate <noreply@apneamate.com>`, DKIM signed by `notify.apneamate.com` → `dkim=pass`, `spf=pass`, aligned via organizational domain.

## Plan

1. Edit `supabase/functions/_shared/email-env.ts`:
   - Change `SENDER_DOMAIN` default from `"apneamate.com"` → `"notify.apneamate.com"`.
   - Keep `FROM_DOMAIN` default = `apneamate.com` (visible From on the root).
   - Keep `ROOT_DOMAIN` default = `apneamate.com`.
2. Redeploy the two functions that use these constants in the outgoing envelope:
   - `send-transactional-email`
   - `auth-email-hook`
   (`process-email-queue`, `handle-email-unsubscribe`, `handle-email-suppression` don't touch these constants.)
3. Optional cleanup (ask before doing): delete the unused `RESEND_API_KEY` and `RESEND_FROM_EMAIL` secrets — legacy from a previous Resend setup, no code references remain.
4. Verify: trigger a password reset, open the raw headers, confirm `dkim=pass header.d=notify.apneamate.com`, `spf=pass`, and `From: Apnea Mate <noreply@apneamate.com>`.

## No hardcoded wrong values elsewhere

Grep confirms the only places touching sender/from domain are `email-env.ts` (defaults) and the two functions above (which import from it). No stray hardcoded domain strings in send paths.

## DNS

Nothing to change at IONOS. The NS delegation is already in place and Lovable manages the DKIM/SPF records inside the delegated subdomain automatically.

## Risks

- Purely a code change. A couple of emails during the brief redeploy window may still use the old build.
- If you'd prefer users to see `noreply@notify.apneamate.com` in their inbox instead of `noreply@apneamate.com`, we can flip `FROM_DOMAIN` too — but the root as visible From is the cleaner branding choice.
