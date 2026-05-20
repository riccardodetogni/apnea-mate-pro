## Diagnosi

Hai ragione su entrambi i punti:

1. **Creazione/modifica spot scollegata da sessione**: oggi `SpotCreator` è usato solo dentro `SpotSelector` dentro `CreateSession`. Non c'è nessun pulsante "Aggiungi spot" su `/spots`, e `SpotDetails` non ha pulsante "Modifica". La policy RLS sui `spots` permette già a qualsiasi utente autenticato di creare, e al `created_by` di modificare — manca solo la UI.

2. **Filtri che sembrano non funzionare** (es. "Deep pool" non mostra le piscine profonde): è **intended behaviour attuale ma confuso**. In `Spots.tsx → sessionsMatchFilters`, i filtri Attività/Livello/Date vengono applicati alle **sessioni future** legate allo spot, non al campo `environment_type` dello spot. Quindi una piscina profonda senza sessioni attive viene nascosta non appena attivi un filtro Attività.

Il filtro "Attività" mescola anche due concetti diversi: i `session_type` (es. `deep_pool_session`) sono mostrati come opzioni, ma molti utenti li leggono come "tipo di spot" (`environment_type` es. `deep_pool`).

## Piano

### 1. Aggiungere creazione spot standalone
- Nuova pagina `src/pages/CreateSpot.tsx` che riusa `<SpotCreator>` (lo stesso componente già esistente con geocoding Nominatim), con header "Nuovo spot" e back button verso `/spots`.
- Route `/spots/new` in `src/App.tsx`, protetta da `RequireAuth`.
- FAB "+" sulla mappa in `Spots.tsx` (in basso a destra, sopra la `BottomNav`), che naviga a `/spots/new`. Visibile solo se utente autenticato.
- Al salvataggio: invalidare `["spots"]` query, toast successo, ritorno a `/spots` con lo spot appena creato selezionato.

### 2. Aggiungere modifica spot
- Pulsante "Modifica" in `SpotDetails.tsx` (header, icona matita) — visibile solo se `spot.created_by === user.id` o admin.
- Nuova pagina `src/pages/EditSpot.tsx` che precompila `SpotCreator` con i dati esistenti e fa `UPDATE`.
- Piccolo refactor di `SpotCreator` per accettare props `initialValues` e `mode: "create" | "edit"`.
- Route `/spots/:id/edit`.

### 3. Sistemare la semantica dei filtri
Cambio in `Spots.tsx → sessionsMatchFilters`:
- **Activity filter**: matcha sia su `spot.environment_type` (mapping `deep_pool` ↔ `deep_pool_session`, `pool` ↔ `pool_session`, `sea` ↔ `sea_session`, ecc.) **OR** su una sessione futura con quel `session_type`. Così "Deep pool" mostra tutte le piscine profonde + spot mare/lago che ospitano sessioni di tipo "piscina profonda".
- **Level / Date filter**: continuano a operare solo sulle sessioni (hanno senso solo nel contesto sessione). Se nessuna sessione corrisponde a Livello/Date attivi, lo spot viene escluso — comportamento corretto.
- Se l'utente attiva **solo** filtri Activity, gli spot senza sessioni ma con `environment_type` matchante restano visibili.

Aggiungere una nota visiva (sottotitolo nella sheet filtri) per chiarire che Livello e Date filtrano per sessioni future.

### 4. Aggiornamenti minori
- i18n: nuove key `addSpot`, `editSpot`, `spotCreated`, `spotUpdated`, `filterHelpLevelDate` (IT/EN).
- Memory: aggiornare `mem://features/spot-management` per riflettere le nuove route e la semantica filtri.

### Fuori scope
- Nessuna modifica a RLS/DB (già supportano create/edit con `created_by`).
- Nessuna eliminazione spot (RLS attuale non la consente e non è richiesto).
