## Update launch email templates

Since you set up email forwarding to support@apneamate.com, update the closing copy in both language versions of the launch announcement email so users know how to reach support.

### Current text (EN)
> "just reply to this email and let us know"

### Current text (IT)
> "basta rispondere a questa email per dircelo"

### Changes
- EN: Replace with wording that references support@apneamate.com (or says replies go to support).
- IT: Same update in Italian.

### Files to edit
1. `supabase/functions/_shared/transactional-email-templates/launch-announcement-en.tsx`
2. `supabase/functions/_shared/transactional-email-templates/launch-announcement-it.tsx`

### Deploy
- Re-deploy the `send-launch-announcement` edge function after edits.