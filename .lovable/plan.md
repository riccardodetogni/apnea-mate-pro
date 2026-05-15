## Goal
1. Show the new Apnea Mate logo at the top of every email we send.
2. Make the sender display name "Apnea Mate" (currently "apnea-mate").
3. Explain what's needed for the round sender avatar in Gmail (BIMI).

## Step 1 — Host the logo so emails can load it

Email clients can't read local React assets — the logo must be a public URL.

- Create a public storage bucket `email-assets`.
- Upload `src/assets/logos/apnea_mate_logo_orizzontale.png` (color, on white) as the header logo for emails (works on the white email background).
- Use the returned public URL as a constant `LOGO_URL` in the templates.

## Step 2 — Add the logo to every template

Insert a `<Img src={LOGO_URL} alt="Apnea Mate" width="160" />` at the top of each template's `<Container>`, replacing the current `🌊 Apnea Mate` text wordmark.

Templates to update:
- `supabase/functions/_shared/email-templates/signup.tsx`
- `supabase/functions/_shared/email-templates/magic-link.tsx`
- `supabase/functions/_shared/email-templates/recovery.tsx`
- `supabase/functions/_shared/email-templates/invite.tsx`
- `supabase/functions/_shared/email-templates/email-change.tsx`
- `supabase/functions/_shared/email-templates/reauthentication.tsx`
- `supabase/functions/_shared/transactional-email-templates/waitlist-confirmation.tsx`

For the three legacy notification functions (`send-certification-notification`, `send-group-notification`, `send-session-notification`), add the same logo `<img>` to their inline HTML.

## Step 3 — Fix the sender display name

Change the `SITE_NAME` constant from `"apnea-mate"` to `"Apnea Mate"` in:
- `supabase/functions/auth-email-hook/index.ts`
- `supabase/functions/send-transactional-email/index.ts`

This makes the From header read `Apnea Mate <noreply@apnea-mate-pro.com>` — exactly the bold name in your screenshot, just capitalized properly.

## Step 4 — Redeploy

Redeploy all affected edge functions so the changes go live.

## Step 5 — Inbox avatar (BIMI) — informational, no code

To get the round logo next to the sender name in Gmail, you (not me) need to:
1. Create an **SVG Tiny PS** version of the symbol logo and host it at a public HTTPS URL.
2. Make sure DMARC on `apnea-mate-pro.com` is at `p=quarantine` or `p=reject`.
3. Add a `BIMI` TXT DNS record pointing to the SVG.
4. (Required by Gmail) Buy a **VMC** (Verified Mark Certificate, ~$1.5k/year from Entrust or DigiCert) and reference it in the BIMI record.

Without VMC, BIMI works on Yahoo/Apple Mail but Gmail won't show the avatar. If you want, I can prepare the BIMI record and host the SVG once you have it — just out of scope for this change.

## Out of scope
- BIMI/VMC setup itself.
- Visual redesign of the email layouts (only swapping the wordmark for the logo image).
