# Aggiungere modifica per Eventi e Corsi

Attualmente solo le Sessioni hanno il pulsante "matita" e una pagina di modifica. Eventi e Corsi non sono modificabili dopo la creazione, e l'RLS non prevede policy di UPDATE per loro.

## Modifiche

### 1. Database (migration)
Aggiungere policy `UPDATE` su `events` e `courses` per il creator se è `instructor` o `admin`, con `group_id` NULL oppure gruppo di cui è owner (stessa logica delle policy INSERT già aggiunte).

### 2. Nuove pagine
- `src/pages/EditEvent.tsx` — clone di `CreateEvent.tsx` che pre-carica i dati dell'evento e fa `UPDATE` invece di `INSERT`. Lo spot e il gruppo restano immutabili (coerente con `EditSession`).
- `src/pages/EditCourse.tsx` — stesso pattern per i corsi.

### 3. Routing
In `src/App.tsx` aggiungere:
- `/events/:id/edit` → `EditEvent`
- `/courses/:id/edit` → `EditCourse`
(entrambe lazy + `RequireAuth`)

### 4. Pulsante matita
- `src/pages/EventDetails.tsx`: nell'header, accanto a "Condividi", mostrare il bottone Pencil quando `user.id === event.creator_id`, che naviga a `/events/:id/edit`.
- `src/pages/CourseDetails.tsx`: stesso pattern verso `/courses/:id/edit`.

## Note
- Niente cambi a Sessioni, alle policy esistenti di INSERT/SELECT/DELETE, né alla logica dei gruppi.
- I campi modificabili sono gli stessi della creazione tranne `spot_id` e `group_id` (immutabili, come per le sessioni).
