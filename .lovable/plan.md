# Mostra la scuola/gruppo come organizzatore nelle card Community

## Obiettivo
Quando una sessione, evento o corso è collegato a un gruppo (scuola), le card nella pagina Community mostreranno **il gruppo** (avatar + nome) come organizzatore, al posto del nome della persona che l'ha creato. Se non c'è alcun gruppo collegato, resta visibile la persona come oggi.

Il creatore personale continuerà a essere visibile nelle pagine di dettaglio (Session/Event/Course Details) — questa modifica riguarda solo le card di anteprima nel feed Community.

## Modifiche

### 1. Dati: aggiungere info del gruppo nei hook
- **`src/hooks/useSessions.ts`**, **`src/hooks/useEvents.ts`**, **`src/hooks/useCourses.ts`**
  - Raccogliere i `group_id` non null dalle righe restituite.
  - Fare una query batch a `groups` per ottenere `id, name, avatar_url, verified`.
  - Aggiungere ai tipi (`SessionWithDetails`, `EventWithDetails`, `CourseWithDetails`) i campi opzionali:
    - `group_name?: string | null`
    - `group_avatar?: string | null`
    - `group_verified?: boolean`

### 2. UI: aggiornare le card
- **`src/components/community/SessionCard.tsx`**
  - Nuove prop opzionali: `groupName?`, `groupAvatar?`, `groupVerified?`.
  - Se `groupName` è presente: mostrare avatar/iniziale del gruppo e nome del gruppo al posto di `creatorName/creatorInitial`; label "Organizzatore" invariata; nascondere il ruolo personale (instructor/etc.) perché stiamo mostrando l'entità gruppo.
  - Se il gruppo è `verified`, mostrare la spunta/badge accanto al nome (coerente con il resto dell'app).
- **`src/components/community/EventCard.tsx`** e **`src/components/community/CourseCard.tsx`**
  - Stessa logica: quando `event.group_id`/`course.group_id` esiste e abbiamo `group_name`, mostrare il gruppo invece di `creator_name`/`creator_avatar`.

### 3. Passaggio prop in `src/pages/Community.tsx`
- Inoltrare i nuovi campi gruppo a `SessionCard` (già usa `{...session}` quindi basterà che il hook restituisca i campi).

## Fuori scope
- Nessuna modifica alle pagine di dettaglio (Session/Event/Course Details).
- Nessuna modifica alle policy RLS o allo schema DB (`group_id` esiste già su tutte e tre le tabelle).
- Nessuna modifica al ranking/filtering del feed Community.
- I gruppi non-school continuano a comportarsi allo stesso modo (basta che ci sia un `group_id`).

## Note tecniche
- I `groups` sono leggibili pubblicamente (necessari per i feed di gruppo già esistenti), quindi nessun problema di RLS.
- Per il fallback dell'avatar gruppo riuseremo lo stesso pattern già in uso in `GroupCard.tsx`.
