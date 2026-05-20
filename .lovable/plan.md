## Problema

Quando un utente si iscrive a un corso o evento, viene creato un record `pending` in `course_participants` / `event_participants`, ma **non succede nient'altro**:
- nessuna notifica in-app o email all'organizzatore;
- nessuna schermata per approvare/rifiutare le richieste;
- nessuna notifica di esito all'iscritto.

Risultato: tutto "frizzato" in pending. Per le sessioni questo flusso esiste già (`send-session-notification`, lista pending in `SessionDetails`, notifiche in-app); per corsi/eventi va replicato.

## Soluzione: replicare il flusso "approvazione richiesta" delle sessioni

### 1. Notifiche & tipi
- Estendere l'enum `notification_type` con: `course_join_request`, `course_request_approved`, `course_request_rejected`, `event_join_request`, `event_request_approved`, `event_request_rejected`.
- Aggiornare `src/lib/notifications.ts` con i nuovi tipi e metadata (`course_id` / `event_id` / `title`).
- Aggiornare `NotificationItem.tsx` con icone, label IT/EN e routing (`/courses/:id`, `/events/:id`).

### 2. Edge Functions email
- Nuova `send-course-notification` con 3 template:
  - `course-join-request` (all'organizzatore)
  - `course-request-approved` / `course-request-rejected` (all'iscritto)
- Nuova `send-event-notification` con i 3 template equivalenti.
- Registrare i 6 template in `supabase/functions/_shared/transactional-email-templates/registry.ts` (riusando lo styling dei template sessione).

### 3. UI lato iscritto
- `CourseDetails.handleJoin` / `EventDetails.handleJoin`: dopo l'insert pending, creare notifica in-app per l'organizzatore + invocare la nuova edge function (`type: "join_request"`).

### 4. UI lato organizzatore
- In `CourseDetails.tsx` e `EventDetails.tsx`, se `user.id === creator_id`, caricare la lista partecipanti completa e mostrare due sezioni come in `SessionDetails`:
  - **Richieste in attesa** con pulsanti Approva / Rifiuta;
  - **Partecipanti confermati**.
- Handler approve: `UPDATE course_participants/event_participants SET status='confirmed'` + notifica in-app + email `request_approved`.
- Handler reject: `DELETE` riga + notifica in-app + email `request_rejected`.

### 5. i18n
Aggiungere stringhe in `src/lib/i18n.ts` (IT/EN): `pendingRequests`, `confirmedParticipants`, `approve`, `reject`, `courseJoinRequest`, `eventJoinRequest`, `requestApproved`, `requestRejected`, ecc. (riusare dove possibile quelle delle sessioni).

## Dettagli tecnici

```text
join click → INSERT pending → notification (in-app + email "join_request") → organizzatore
organizzatore approva → UPDATE confirmed → notification (in-app + email "request_approved") → iscritto
organizzatore rifiuta → DELETE row → notification (in-app + email "request_rejected") → iscritto
```

- RLS già OK: `course_participants` e `event_participants` hanno policy `UPDATE` per il creatore via subquery su `courses.creator_id` / `events.creator_id`.
- Trigger `enforce_course_capacity` / `enforce_event_capacity` esistono già per la prevenzione overbooking.
- Edge functions: pattern identico a `send-session-notification` (template idempotency key `course-{type}-{id}-{userId}`).

## Out of scope
- Nessuna modifica al pricing/pagamenti.
- Nessun cambio al flusso di creazione corsi/eventi.
- Le chat di evento (già esistenti) non vengono toccate.
