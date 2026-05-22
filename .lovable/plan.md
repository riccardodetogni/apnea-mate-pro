## Add "Delete event/course" action

Confirmed: today only participants can cancel their own registration. Creators (and admins) have no way to delete an event or a course — that's the gap to close.

### Where to add

Place a **"Elimina evento" / "Elimina corso"** destructive button at the bottom of the edit pages, after "Salva modifiche":

- `src/pages/EditEvent.tsx`
- `src/pages/EditCourse.tsx`

(Creators already land on these pages from EventDetails/CourseDetails, and the pages already enforce ownership via `creator_id === user.id`.)

### Behavior

1. Red outlined "Elimina" button below "Salva modifiche".
2. Tapping it opens an `AlertDialog` confirmation ("Sei sicuro? L'azione è irreversibile. Tutti i partecipanti verranno rimossi.").
3. On confirm:
   - Delete child rows first to avoid FK errors:
     - Event: `event_participants`, `event_schedule` where `event_id = id`
     - Course: `course_participants` (and any schedule table if present) where `course_id = id`
   - Delete the parent row from `events` / `courses`.
   - Toast "Evento eliminato" / "Corso eliminato" and `navigate(-1)` (or `/community`).
4. Only the creator or an admin can see/use the button. Edit pages already gate by `creator_id`, so the button just renders within that page. RLS on `events`/`courses` should already allow the creator to delete; if not, we'll add a DELETE policy in a migration.

### Files to edit
- `src/pages/EditEvent.tsx` — add delete button + handler + AlertDialog
- `src/pages/EditCourse.tsx` — same
- Translation keys in `src/i18n` (IT/EN): `deleteEvent`, `deleteCourse`, `confirmDeleteEventTitle`, `confirmDeleteEventDescription`, `eventDeleted`, `courseDeleted`, etc.

### Possible follow-up
If RLS blocks creator deletes, add a migration with a DELETE policy:
`USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'))` on both `events` and `courses`.