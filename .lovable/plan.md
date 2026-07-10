# Contact Organiser Before Joining

Let users message the organiser of a session, event, or course directly from the details page, without visiting the profile.

## UX

On `SessionDetails`, `EventDetails`, and `CourseDetails`, add a secondary button **"Contatta organizzatore"** next to the main Join / participation CTA (hidden when the current user is the organiser).

Tapping the button opens a bottom sheet **`ContactOrganiserSheet`** with:
- Header: organiser avatar + name + activity title.
- 3–4 tappable **suggested questions** (chips) tailored to the entity type:
  - Session: "Che livello è richiesto?", "Serve attrezzatura specifica?", "Ci sono ancora posti?"
  - Event: "Info logistica/alloggio?", "Che livello serve?", "È incluso il pranzo?"
  - Course: "Qual è il programma?", "Serve certificazione precedente?", "Come si effettua il pagamento?"
- Free-text `Textarea` (prefilled when a chip is tapped, still editable).
- Primary button **"Invia messaggio"**.

On send:
1. Get-or-create a DM conversation between current user and organiser via existing `getOrCreateDMConversation`.
2. Prepend a small context line to the first message so the organiser knows what it refers to, e.g.:
   `📌 Riguardo a "<titolo>" (sessione/evento/corso)\n\n<user text>`
3. Insert the message, close the sheet, navigate to `/chat/:conversationId`.

Always enabled — no organiser opt-out (per user's choice).

## Technical

New file: `src/components/chat/ContactOrganiserSheet.tsx`
- Props: `open`, `onOpenChange`, `organiserId`, `organiserName`, `organiserAvatarUrl`, `entityType: 'session'|'event'|'course'`, `entityTitle`.
- Uses shadcn `Sheet` (bottom) + existing button/textarea primitives.
- Suggested questions defined in a small constant map keyed by `entityType` (Italian + English via `t()` if trivially available; otherwise IT literals — the app is IT-first per existing UI).
- On submit: call helper `sendContactOrganiserMessage(currentUserId, organiserId, entityType, entityTitle, text)` that wraps `getOrCreateDMConversation` + `supabase.from('messages').insert(...)` and returns `{ conversationId }`. Add this helper in `src/hooks/useConversations.ts` (colocated with the other DM helpers) or a new `src/lib/contactOrganiser.ts` — prefer the latter to keep hooks clean.
- Uses `useAuth()` for current user; toast on error via `useToast`.

Wiring:
- `src/pages/SessionDetails.tsx`: add button in the CTA area; hide if `user?.id === session.creator_id`.
- `src/pages/EventDetails.tsx`: same pattern with `event.creator_id`.
- `src/pages/CourseDetails.tsx`: same pattern with `course.creator_id`.

No schema, RLS, or edge function changes — DMs already work end-to-end and messages RLS already permits participants to insert.

## Out of scope

- No card-level chat icon on feeds (kept off per chosen option).
- No organiser opt-out toggle.
- No changes to notifications (the recipient already gets standard message notifications through the existing chat pipeline; if they don't, that's a separate follow-up).

## Verification

- Open a session created by another user → "Contatta organizzatore" visible; on own session → not visible.
- Tap a suggested question → text prefilled and editable.
- Send → lands on `/chat/:id` with the message visible; organiser sees it in `Messages`.
- Repeat with an event and a course.
