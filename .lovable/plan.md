

# Add App Links to Email Notifications (corrected URL)

## Summary

Add CTA buttons with deep links to the app in all notification emails. Use the production domain `https://apnea-mate-pro.com`.

## Changes

### 1. `supabase/functions/send-session-notification/index.ts`
- Add `const APP_URL = "https://apnea-mate-pro.com"`
- Add styled CTA button in each email variant:
  - **join_request**: "Gestisci richiesta" → `${APP_URL}/sessions/${sessionId}`
  - **request_approved**: "Vedi sessione" → `${APP_URL}/sessions/${sessionId}`
  - **request_rejected**: "Esplora sessioni" → `${APP_URL}/community`

### 2. `supabase/functions/send-group-notification/index.ts`
- Same `APP_URL` constant
  - **request_approved**: "Vai al gruppo" → `${APP_URL}/groups/${groupId}`
  - **request_rejected**: "Esplora gruppi" → `${APP_URL}/community`

### 3. `supabase/functions/send-certification-notification/index.ts`
- Same `APP_URL` constant
  - **approved**: "Vai al profilo" → `${APP_URL}/profile`
  - **rejected**: "Riprova" → `${APP_URL}/settings`

### Button style (shared across all templates)
```html
<a href="..." style="display:inline-block; background:#3f66e8; color:#ffffff; font-size:15px; font-weight:bold; border-radius:18px; padding:14px 28px; text-decoration:none; margin:16px 0;">
  CTA Text
</a>
```

Consistent with the auth email template buttons already in the project.

### Technical notes
- No database changes
- All 3 edge functions will be redeployed after editing
- URL is hardcoded as a constant (can move to env var later if needed)

