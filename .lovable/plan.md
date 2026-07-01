The file `supabase/functions/_shared/email-env.ts` already defaults `FROM_DOMAIN` and `SENDER_DOMAIN` to `apneamate.com`. The remaining step is to deploy the affected Edge Functions so they start using the verified domain, then verify deliverability.

## What I will do
1. Redeploy the 5 Edge Functions that read `email-env.ts`:
   - `send-transactional-email`
   - `auth-email-hook`
   - `process-email-queue`
   - `handle-email-unsubscribe`
   - `handle-email-suppression`
2. Trigger a test email (e.g. password reset or any app notification) and ask the user to check the `Authentication-Results` header for `spf=pass` and `dkim=pass` on `apneamate.com`.

## No code change needed
`email-env.ts` already uses `apneamate.com` as the fallback/default, so no file edit is required. No publish is needed either — this is a backend deploy.

## Risks / notes
- During deploy, a few emails might still use the old function revision for a few seconds. No user action is required.
- The root domain `apneamate.com` is already verified and Lovable manages its SPF/DKIM, so DNS changes are not needed.
- If you later want to use `notify.apneamate.com`, it must be added as a verified email domain first.
