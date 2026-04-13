

# Aggiungere "Eventi" all'app ApneaMate

## Concetto

Gli eventi sono attività multi-giorno (stage, gare, trip) distinti dalle sessioni singole. Creabili solo da istruttori o owner di gruppi, con programma giornaliero opzionale. Visibili sia in Community che nelle pagine dei gruppi.

## Database

### Nuova tabella `events`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| title | text | Obbligatorio |
| description | text | Opzionale |
| event_type | text | `stage`, `competition`, `trip` |
| start_date | date | Primo giorno |
| end_date | date | Ultimo giorno |
| location | text | Luogo dell'evento |
| latitude/longitude | numeric | Per filtro distanza |
| max_participants | int | 0 = illimitati |
| is_paid | boolean | |
| creator_id | uuid | Chi crea |
| group_id | uuid | Opzionale, associato a un gruppo |
| is_public | boolean | |
| status | text | active/cancelled |
| cover_image_url | text | Immagine copertina opzionale |
| created_at/updated_at | timestamptz | |

### Nuova tabella `event_schedule` (programma giornaliero opzionale)
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| event_id | uuid FK | |
| day_number | int | Giorno 1, 2, 3... |
| title | text | Es. "Teoria + piscina" |
| description | text | Dettagli opzionali |
| start_time | time | Opzionale |
| end_time | time | Opzionale |

### Nuova tabella `event_participants`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| event_id | uuid FK | |
| user_id | uuid | |
| status | text | pending/confirmed/cancelled |
| joined_at | timestamptz | |

### RLS Policies
- **SELECT**: eventi pubblici visibili a tutti; privati visibili ai membri del gruppo
- **INSERT**: solo istruttori/admin o owner del gruppo associato
- **UPDATE/DELETE**: solo creator
- Partecipanti: stesse logiche delle sessioni

## UI e Navigazione

### 1. Community Page — Nuova sezione "Eventi in arrivo"
Posizionata tra le sessioni e i gruppi. Card orizzontale scrollabile con design diverso dalle sessioni:

```text
┌─────────────────────────┐
│ 🏷 Stage · Sardegna     │
│ 15-18 Apr 2026          │
│                         │
│ Deep Week Sardegna      │
│                         │
│ 🏊 4 giorni · 12 posti  │
│                         │
│ 👤 Mario R. · Istruttore│
│              [Dettagli] │
└─────────────────────────┘
```

Card più larga delle sessioni, con range di date e badge tipo evento. Colori distinti per tipo (stage=viola, gara=rosso, trip=blu).

### 2. Pagina Dettaglio Evento (`/events/:id`)
- Hero con immagine copertina (o gradient)
- Info: date, luogo, tipo, posti, prezzo
- Mappa con SpotMiniMap
- Tab "Programma" (se presente): timeline giornaliera
- Tab "Partecipanti": lista iscritti
- Azione: "Richiedi iscrizione" / "Iscritto" / "In attesa"
- Chat di gruppo (come per sessioni)

### 3. Pagina Gruppo — Sezione "Eventi del gruppo"
Sotto le sessioni, mostrare gli eventi associati al gruppo con le stesse card.

### 4. Creazione Evento
- Aggiungere "Evento" come quarta opzione nella pagina `/create`
- Form dedicato (`/create/event`) con:
  - Tipo evento (stage/gara/trip)
  - Titolo, descrizione, date inizio/fine
  - Luogo (con LocationAutocomplete)
  - Partecipanti max, sessione a pagamento
  - Associazione a gruppo (opzionale)
  - Programma giornaliero (toggle per attivarlo, poi righe dinamiche)

### 5. My Sessions → "Le mie attività"
Aggiungere tab o sezione per eventi a cui si è iscritti, con calendar integration.

### 6. Search
Aggiungere tab "Eventi" nella pagina di ricerca globale.

## File da creare/modificare

### Nuovi file (~10)
- `src/pages/EventDetails.tsx` — pagina dettaglio
- `src/pages/CreateEvent.tsx` — form creazione
- `src/components/community/EventCard.tsx` — card per Community/gruppo
- `src/components/events/EventSchedule.tsx` — timeline programma
- `src/components/events/EventParticipants.tsx` — lista partecipanti
- `src/hooks/useEvents.ts` — fetch + join/leave
- `src/hooks/useEventDetails.ts` — dettaglio singolo evento

### File da modificare (~8)
- `src/App.tsx` — nuove route `/events/:id`, `/create/event`
- `src/pages/Community.tsx` — sezione "Eventi in arrivo"
- `src/pages/GroupDetails.tsx` — sezione eventi del gruppo
- `src/pages/Create.tsx` — quarta opzione "Evento"
- `src/pages/MySessions.tsx` — sezione eventi
- `src/pages/Search.tsx` — tab eventi
- `src/hooks/useSearch.ts` — query eventi
- `src/lib/i18n.ts` — nuove traduzioni
- 3 migration SQL per tabelle + RLS + realtime

## Ordine di implementazione

1. **Migration DB**: tabelle + RLS + realtime
2. **Hook dati**: `useEvents`, `useEventDetails`
3. **EventCard**: componente card
4. **Community + GroupDetails**: integrare sezione eventi
5. **CreateEvent**: form creazione
6. **EventDetails**: pagina dettaglio con programma e partecipanti
7. **MySessions + Search**: integrazione eventi
8. **i18n**: traduzioni IT/EN

Stima: implementazione in 4-5 step progressivi.

