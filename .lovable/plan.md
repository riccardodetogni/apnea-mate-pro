## Obiettivo
Estendere la sezione "Impostazioni" del Gestisci gruppo (`/groups/:id/manage`) per consentire al proprietario di modificare tutti i campi principali, oggi limitati a avatar/nome/descrizione.

## Campi da aggiungere alla modifica
Allineare i campi modificabili a quelli del form di creazione (`CreateGroup.tsx`):

- **Posizione** (`location`) — input con `LocationAutocomplete` per geocodificare e salvare `location`, `latitude`, `longitude`.
- **Tipo di gruppo** (`group_type`) — selezione tra `community` / `school` / `diving_center` (stessi 3 bottoni di CreateGroup).
- **Visibilità / approvazione** (`requires_approval`) — toggle "Gruppo aperto" vs "Accesso su richiesta".

I campi già presenti (avatar, nome, descrizione) restano invariati.

## Note funzionali
- Se l'utente cambia il tipo a un valore diverso da `school`, il flag `verified` deve restare invariato (non lo modifichiamo: solo gli admin lo gestiscono). Il blocco "Richiedi verifica" continua ad apparire solo per `school` non verificati, calcolato sul valore corrente.
- La modifica della posizione aggiorna anche `latitude` / `longitude` (cast a numero) per non rompere ricerche per distanza.
- Nessun cambiamento alle RLS: la policy "Group creators can update groups" già consente al creatore di aggiornare qualsiasi colonna.

## Modifiche tecniche

### 1. `src/hooks/useGroupDetails.ts`
- Estendere il tipo del parametro di `updateGroup` per includere: `location`, `latitude`, `longitude`, `group_type`, `requires_approval` (oltre ai campi esistenti).

### 2. `src/pages/GroupManage.tsx`
Nel `TabsContent value="settings"`:
- Aggiungere stato locale per `groupLocation`, `groupLat`, `groupLng`, `groupType`, `requiresApproval`, sincronizzato in `useEffect` quando `group` viene caricato.
- Inserire dopo il campo Descrizione:
  - `LocationAutocomplete` per la posizione.
  - Gruppo di 3 bottoni per il tipo (riusare lo stile di CreateGroup: pillole/cards per Community / Scuola / Diving Center).
  - 2 bottoni o `RadioGroup` per visibilità (Aperto / Su approvazione).
- In `handleSaveSettings` includere tutti i nuovi campi nella chiamata `updateGroup`.

### 3. Nessuna migrazione DB
Tutti i campi esistono già nella tabella `groups` (`location`, `latitude`, `longitude`, `group_type`, `requires_approval`).

### 4. i18n
Riutilizzare le chiavi già esistenti usate in CreateGroup (`groupTypeLabel`, `groupTypeCommunity`, `groupTypeSchool`, `groupTypeDivingCenter`, `groupVisibility`, `visibilityOpen`, `visibilityApproval`, `groupLocationPlaceholder`). Aggiungere solo eventuali label mancanti.

## Out of scope
- Eventi e Corsi: già hanno `/events/:id/edit` e `/courses/:id/edit` con tutti i campi modificabili; nessuna modifica.