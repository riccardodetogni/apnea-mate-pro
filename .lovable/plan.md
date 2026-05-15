## Goal
When a visitor submits their email on the Coming Soon page, they receive a branded confirmation email letting them know they're on the waitlist.

## Approach
Use Lovable's built-in app email system (the project already has the email domain `apnea-mate-pro.com` set up and used by auth emails).

## Steps

1. **Ensure email infrastructure is ready**
   - Verify the shared email queue infra is in place (used by auth emails today). If missing, set it up.

2. **Scaffold app (transactional) email support**
   - Add the `send-transactional-email` edge function and the templates registry under `supabase/functions/_shared/transactional-email-templates/`.
   - Add an unsubscribe page in the app (required by the system) at a path like `/unsubscribe`, styled to match the Coming Soon look.

3. **Create the waitlist confirmation template**
   - File: `_shared/transactional-email-templates/waitlist-confirmation.tsx`
   - Tone: short, warm, Italian, on-brand (navy + teal/blue, white body background, "Apnea Mate" wordmark, tagline "Connect. Dive. Explore.").
   - Subject: "Sei nella lista d'attesa di Apnea Mate 🌊"
   - Content: thank-you, confirmation that we'll notify them at launch (22 May 2026), brief teaser of what's coming, link back to `https://apnea-mate-pro.com`.
   - System auto-appends the unsubscribe footer — we won't add one.

4. **Wire the trigger in `src/pages/ComingSoon.tsx`**
   - After a successful `waitlist` insert, call `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'waitlist-confirmation', recipientEmail, idempotencyKey: 'waitlist-<email>' } })`.
   - Keep the existing success/duplicate UX. Email send failures must not block or surface as a form error to the user — only logged.

5. **Deploy** the new edge functions.

## Out of scope
- No changes to the visual design of the Coming Soon page.
- No admin notification email (only the visitor receives one). Let me know if you also want a notification to the team on each signup.
