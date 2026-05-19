## Feedback Feature

Allow logged-in users to send feedback or suggestions to admins. Entry point lives in Settings; admins triage in the Admin dashboard. In-app only, no emails.

### 1. Database (new migration)

Create `public.feedback` table:
- `id` uuid PK
- `user_id` uuid NOT NULL (the sender — never nullable, RLS depends on it)
- `category` text NOT NULL — one of `bug`, `suggestion`, `other`
- `message` text NOT NULL (length capped client-side at ~2000 chars)
- `status` text NOT NULL default `new` — one of `new`, `in_review`, `resolved`
- `admin_notes` text nullable
- `created_at`, `updated_at` timestamps + `update_updated_at_column` trigger

RLS policies:
- INSERT: `auth.uid() = user_id` (any authenticated user)
- SELECT own: `auth.uid() = user_id`
- SELECT all: `has_role(auth.uid(), 'admin')`
- UPDATE: admins only (for status / admin_notes)
- DELETE: admins only

Add validation trigger: enforce `category IN (...)` and `status IN (...)` and `length(message) BETWEEN 1 AND 2000`.

### 2. User-facing UI

**`src/pages/Settings.tsx`** — currently nearly empty. Add a "Send feedback" row (icon + label + chevron) that opens a bottom sheet (`@/components/ui/sheet`). The sheet contains:
- Category select (Bug / Suggestion / Other) with i18n labels
- Textarea for message (zod-validated, 1–2000 chars, trimmed)
- Submit button → inserts row, shows toast, closes sheet
- Below: collapsible "My previous feedback" list showing the user's own submissions with status badge

New component: `src/components/feedback/FeedbackSheet.tsx`.

### 3. Admin UI

**`src/pages/Admin.tsx`** — add a third tab "Feedback" alongside Users and Groups. Shows list sorted by `status='new'` first, then `created_at desc`. Each card shows sender (name + avatar, link to profile), category badge, message, timestamp, and controls to:
- Change status (new → in_review → resolved)
- Add/edit `admin_notes` inline
- Delete

Unread counter on the tab = count where `status='new'`.

New component: `src/components/admin/FeedbackList.tsx`. New hook: `src/hooks/useFeedback.ts` (list, submit, updateStatus, delete).

### 4. i18n

Add keys to `src/lib/i18n.ts` (it/en): `sendFeedback`, `feedbackCategory`, `feedbackBug`, `feedbackSuggestion`, `feedbackOther`, `feedbackMessagePlaceholder`, `feedbackSubmit`, `feedbackSent`, `myFeedback`, `feedbackStatusNew`, `feedbackStatusInReview`, `feedbackStatusResolved`, `adminFeedback`, `adminNotes`.

### 5. Out of scope (explicit)

- No email notifications to admins
- No floating button / no entry on Profile or other pages
- No reply-to-user thread (admin_notes are admin-only)

### Files to create
- `supabase/migrations/<timestamp>_feedback.sql`
- `src/components/feedback/FeedbackSheet.tsx`
- `src/components/admin/FeedbackList.tsx`
- `src/hooks/useFeedback.ts`

### Files to edit
- `src/pages/Settings.tsx` — add entry row + mount sheet
- `src/pages/Admin.tsx` — add Feedback tab + render list
- `src/lib/i18n.ts` — translation keys
