## Replicare flusso approvazione su EventDetails

Applicare a `src/pages/EventDetails.tsx` lo stesso pattern già implementato su `CourseDetails.tsx`.

### Modifiche
1. **`handleJoin`**: inserire iscrizione con `status='pending'` e inviare notifica in-app + email `event_join_request` all'organizzatore.
2. **`loadParticipants`**: caricare iscritti con profilo (avatar, nome, livello), separati in `pending` e `confirmed`.
3. **UI organizzatore** (visibile solo se `user.id === creator_id`):
   - Sezione **Richieste in attesa** con bottoni Approva / Rifiuta.
   - Sezione **Partecipanti confermati** con possibilità di rimozione.
4. **`handleApprove`**: `UPDATE status='confirmed'` + email/notifica `event_request_approved`.
5. **`handleReject`**: `DELETE` riga + email/notifica `event_request_rejected`.
6. **i18n**: riusare le chiavi già aggiunte per i corsi, aggiungendo varianti `event.*` dove necessario.

### Note tecniche
- Edge function `send-event-notification` già deployata.
- Enum notification_type già esteso.
- RLS già permette UPDATE/DELETE all'organizzatore tramite subquery su `creator_id`.
- Nessuna modifica DB necessaria.
