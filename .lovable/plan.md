# Fix filtro pagina Spot

## Diagnosi (il filtro è rotto)

In `src/pages/Spots.tsx` il testo della search bar (`searchQuery`) viene applicato **solo** alla lista `spots` (righe 103-110). I punti `events` e `courses` sulla mappa (`eventPoints`, `coursePoints`, righe 163-181) sono calcolati indipendentemente e **non ricevono mai il filtro di ricerca**.

Risultato osservato quando scrivi "Napoli":
- gli Spot blu vengono correttamente filtrati (spariscono quelli non-Napoli)
- gli Eventi (viola) e i Corsi (arancioni) restano tutti visibili ovunque, perché ignorano `searchQuery`
- sembra che "spariscano gli spot con sessioni" solo perché non ce n'è nessuno a Napoli nel dataset, ma il vero bug è che le altre due categorie non sono filtrate

Inoltre i chip "Eventi" / "Corsi" oggi funzionano come toggle indipendenti (mostra/nascondi intero layer). Vuoi che si comportino come filtri di categoria cliccabili accanto a "Tutti / Preferiti".

## Modifiche proposte (solo `src/pages/Spots.tsx`)

### 1. Search bar filtra tutti e tre i layer per luogo

Estrarre un helper `matchesQuery(query, ...fields)` che:
- normalizza la query (trim, lowercase, rimozione accenti via `String.prototype.normalize("NFD").replace(/\p{Diacritic}/gu, "")`)
- se la query contiene solo caratteri "safe" (lettere/numeri/spazi), fa un match `includes` su ogni token (AND fra token, OR fra i campi) — così "napoli centro" matcha "Napoli, Centro Storico"
- se la query contiene caratteri regex (`^`, `$`, `.`, `*`, `+`, `?`, `(`, `[`, `\`), la interpreta come regex case-insensitive tollerando errori di sintassi (try/catch, fallback a `includes`)

Applicare il matcher a:
- `spots`: campi `name`, `location`
- `events`: campi `title`, `city`, `location`, `spot_name` (usare quelli disponibili — verificheremo `useEvents` types)
- `courses`: campi `title`, `city`, `location`, `spot_name`

`eventPoints` / `coursePoints` diventano `useMemo` che partono dalla lista filtrata (search + toggle categoria).

### 2. Chip categoria unificati

Sostituire i due toggle `showEvents` / `showCourses` con uno stato `categories: Set<"spots" | "events" | "courses">` (default: tutte attive). I chip cliccabili nella barra diventano:

- Tutti (reset → tutte attive)
- Preferiti (rimane come quick filter sugli spot)
- Spot (badge blu)
- Eventi (badge viola)
- Corsi (badge arancione)

Cliccare un chip toggla la categoria corrispondente. Se nessuna categoria è attiva, mostra "Tutti" come attivo visivamente. La legenda in basso a sinistra rispecchia lo stato.

### 3. Nessun altro cambiamento

- `SpotFiltersSheet` (attività/livello/data) resta invariato: continua ad agire sui soli spot come oggi
- `useEvents` / `useCourses` non toccati
- Backend, RLS, tipi DB invariati

## Dettagli tecnici

- File modificato: `src/pages/Spots.tsx`
- Prima di scrivere il matcher verifico i campi effettivi di `Event` e `Course` con `code--view` su `src/hooks/useEvents.ts` e `src/hooks/useCourses.ts` per usare i nomi corretti
- Regex fallback silenzioso: `let re; try { re = new RegExp(query, "i"); } catch { return includesMatch(...) }`
- Ordine di filtraggio: `categories` → `searchQuery` → (per spot) `quickFilter=favorites` → `advancedFilters`

## Fuori scope

- Ricerca geografica reale (geocoding di "Napoli" → coordinate + raggio): resta il match testuale sui campi luogo/titolo
- Modifiche al `SpotFiltersSheet`
- Filtri per data/livello su eventi e corsi