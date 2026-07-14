## Problema

`useAdmin` è lento per due motivi principali (non la quantità di dati in sé, ma **query N+1**):

1. **Utenti:** fa 1 query per prendere tutti i profili, poi **una query `user_roles` per ogni utente** in serie. Con 200 utenti = 201 round-trip.
2. **Gruppi:** stessa cosa — 1 query gruppi + **una `count` `group_members` per ogni gruppo** in serie.
3. Entrambi i fetch partono insieme al mount della dashboard, anche se stai guardando solo il tab "Users".
4. `FeedbackList` carica tutti i feedback in parallelo per il badge conteggio.

## Soluzione

Combino tre fix, in ordine di impatto:

### 1. Eliminare le N+1 (fix principale, risolve ~90% del problema)

- **Users:** una sola query `user_roles` con `.in("user_id", [...])` per tutti gli utenti, poi merge in memoria. Da 201 query → 2.
- **Groups:** una sola query aggregata su `group_members` raggruppata per `group_id` (via RPC o query con `select` + count lato client su una singola fetch filtrata `status = 'approved'`). Da 1+N → 2.

### 2. Paginazione + ricerca lato server sulla tab Users

- Lista utenti con **page size 25**, ordinati per `created_at desc`.
- Barra di ricerca (nome/email) con debounce che filtra via `.ilike` su `profiles` — così anche con migliaia di utenti la dashboard resta istantanea.
- Bottoni "Precedente / Successiva" + indicatore "Pagina X di Y" (uso `count: 'exact'` sulla query profili per il totale).
- Il conteggio nel tab (`Users (N)`) diventa il totale dal `count`, non `allUsers.length`.

### 3. Lazy-load per tab

- Al mount carico **solo il tab attivo** (default: Users). Groups e Feedback si caricano quando l'utente clicca la loro tab (e restano in cache via lo state esistente).
- Il badge "N new" sul tab Feedback diventa una singola query leggera `select count` con `status = 'new'` invece di scaricare tutti i feedback.

## File toccati

- `src/hooks/useAdmin.ts` — refactor fetch: batch roles/members, aggiungo `usersPage`, `usersSearch`, `usersTotal`, `fetchUsersPage()`, lazy fetch groups.
- `src/pages/Admin.tsx` — UI paginazione + search input nel tab Users, trigger fetch groups/feedback on tab change, badge feedback da conteggio leggero.
- `src/hooks/useFeedback.ts` — aggiungo `useNewFeedbackCount()` (solo count) da usare per il badge; `useAllFeedback` resta ma viene chiamato solo quando la tab feedback è attiva.

## Fuori scope

- Nessuna modifica a schema DB, RLS, o alle altre pagine.
- Nessun cambio al design/token.
- Nessuna paginazione su Groups/Feedback per ora (dopo il fix N+1 sono già veloci; se in futuro crescono molto si aggiunge con lo stesso pattern).
