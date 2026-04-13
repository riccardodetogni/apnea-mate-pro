

# Aggiungere "Eventi" e "Corsi" all'app ApneaMate

## Concetto

Due nuove entità distinte dalle sessioni:
- **Eventi**: attività multi-giorno (stage, gare, trip) — creabili da istruttori e owner di gruppi
- **Corsi**: percorsi formativi delle scuole (corso apnea base, avanzato, ecc.) — creabili da istruttori e owner di gruppi

Entrambi hanno: data inizio/fine, descrizione testuale libera, e campi di contatto opzionali (email, telefono, link esterno).

## Database

### Tabella `events`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| title | text NOT NULL | |
| description | text | Testo libero |
| event_type | text NOT NULL | `stage`, `competition`, `trip` |
| start_date | date NOT NULL | |
| end_date | date NOT NULL | |
| location | text | |
| latitude / longitude | numeric | Per filtro distanza |
| max_participants | int DEFAULT 0 | 0 = illimitati |
| is_paid | boolean DEFAULT false | |
| creator_id | uuid NOT NULL | |
| group_id | uuid | Opzionale |
| is_public | boolean DEFAULT true | |
| status | text DEFAULT 'active' | |
| cover_image_url | text | |
| contact_email | text | Email di contatto |
| contact_phone | text | Telefono |
| contact_url | text | Link esterno per info |
| created_at / updated_at | timestamptz | |

### Tabella `event_participants`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| event_id | uuid FK | |
| user_id | uuid | |
| status | text DEFAULT 'pending' | pending/confirmed |
| joined_at | timestamptz | |

### Tabella `event_schedule` (programma opzionale)
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| event_id | uuid FK | |
| day_number | int | |
| title | text | |
| description | text | |
| start_time / end_time | time | Opzionali |

### Tabella `courses`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| title | text NOT NULL | Es. "Corso Apnea 1° Livello" |
| description | text | Testo libero con dettagli |
| course_type | text NOT NULL | `beginner`, `advanced`, `instructor`, `specialty` |
| start_date | date NOT NULL | |
| end_date | date NOT NULL | |
| location | text | |
| latitude / longitude | numeric | |
| max_participants | int DEFAULT 0 | |
| is_paid | boolean DEFAULT false | |
| creator_id | uuid NOT NULL | |
| group_id | uuid | Associato a scuola/gruppo |
| is_public | boolean DEFAULT true | |
| status | text DEFAULT 'active' | |
| cover_image_url | text | |
| contact_email | text | Email per iscrizioni |
| contact_phone | text | Telefono |
| contact_url | text | Link al sito della scuola |
| created_at / updated_at | timestamptz | |

### Tabella `course_participants`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| course_id | uuid FK | |
| user_id | uuid | |
| status | text DEFAULT 'pending' | |
| joined_at | timestamptz | |

### RLS (uguale per entrambi)
- **SELECT**: pubblici visibili a tutti; privati solo a membri del gruppo
- **INSERT**: solo chi ha ruolo `instructor`/`admin` O è owner del gruppo associato
- **UPDATE/DELETE**: solo creator
- **Partecipanti**: insert se `auth.uid() = user_id`, select pubblico, delete per sé stessi

### Realtime
Abilitato su `events`, `event_participants`, `courses`, `course_participants`.

## UI e Navigazione

### 1. Community Page — Due nuove sezioni
- **"Eventi in arrivo"**: sezione con card orizzontali scrollabili, tra sessioni e gruppi
- **"Corsi disponibili"**: sezione analoga sotto gli eventi

Card con design distinto:
```text
┌──────────────────────────┐
│ 🏷 Stage · Sardegna      │
│ 15-18 Apr 2026           │
│ Deep Week Sardegna       │
│ 🏊 4 giorni · 12 posti   │
│ 👤 Mario R. · Istruttore │
│               [Dettagli] │
└──────────────────────────┘

┌──────────────────────────┐
│ 🎓 Corso · Milano        │
│ 1-30 Mag 2026            │
│ Apnea 1° Livello         │
│ 📧 info@scuola.it        │
│ 👤 Scuola Sub Milano     │
│               [Dettagli] │
└──────────────────────────┘
```

Colori distinti: eventi (stage=viola, gara=rosso, trip=blu), corsi (verde scuro).

### 2. Pagina Dettaglio (`/events/:id` e `/courses/:id`)
- Hero con immagine o gradient colorato per tipo
- Date inizio/fine, luogo, tipo, posti
- **Descrizione testuale** (con linkify per rendere cliccabili URL, email e telefoni nel testo)
- **Sezione contatti**: email (mailto:), telefono (tel:), link esterno — mostrati come chip/bottoni cliccabili
- Programma giornaliero opzionale (solo eventi)
- Lista partecipanti
- Azione: "Richiedi iscrizione" / "Iscritto" / "In attesa"

### 3. Pagina Gruppo — Sezioni aggiuntive
- "Eventi del gruppo" sotto le sessioni
- "Corsi del gruppo" sotto gli eventi (particolarmente utile per le scuole)

### 4. Creazione — Due nuove opzioni in `/create`
- **"Evento"** (icona Ticket, viola): stage/gara/trip
- **"Corso"** (icona GraduationCap, verde): percorsi formativi

Form dedicati (`/create/event` e `/create/course`) con:
- Tipo, titolo, descrizione
- Date inizio/fine
- Luogo (LocationAutocomplete)
- Max partecipanti, a pagamento
- Gruppo associato (opzionale)
- **Contatti**: email, telefono, link (tutti opzionali)
- Programma giornaliero (solo eventi, toggle opzionale)

Visibile solo a istruttori e owner di gruppi.

### 5. My Sessions → "Le mie attività"
Tab/sezione per eventi e corsi a cui si è iscritti.

### 6. Search
Due nuovi tab: "Eventi" e "Corsi" nella ricerca globale.

## File da creare (~12)
- `src/pages/EventDetails.tsx`
- `src/pages/CourseDetails.tsx`
- `src/pages/CreateEvent.tsx`
- `src/pages/CreateCourse.tsx`
- `src/components/community/EventCard.tsx`
- `src/components/community/CourseCard.tsx`
- `src/components/events/EventSchedule.tsx`
- `src/components/events/ContactInfo.tsx` (riusabile per eventi e corsi)
- `src/hooks/useEvents.ts`
- `src/hooks/useEventDetails.ts`
- `src/hooks/useCourses.ts`
- `src/hooks/useCourseDetails.ts`

## File da modificare (~8)
- `src/App.tsx` — route `/events/:id`, `/courses/:id`, `/create/event`, `/create/course`
- `src/pages/Community.tsx` — sezioni eventi e corsi
- `src/pages/GroupDetails.tsx` — sezioni eventi e corsi del gruppo
- `src/pages/Create.tsx` — opzioni "Evento" e "Corso"
- `src/pages/MySessions.tsx` — sezioni eventi/corsi
- `src/pages/Search.tsx` + `src/hooks/useSearch.ts` — tab eventi e corsi
- `src/lib/i18n.ts` — traduzioni IT/EN

## Migration SQL
Una singola migration con:
1. Tabelle `events`, `event_schedule`, `event_participants`, `courses`, `course_participants`
2. RLS policies per tutte
3. Realtime su tabelle principali
4. Trigger `updated_at` su events e courses

## Ordine di implementazione
1. Migration DB (tabelle + RLS + realtime)
2. Hooks dati (`useEvents`, `useCourses`, `useEventDetails`, `useCourseDetails`)
3. Componenti card (`EventCard`, `CourseCard`, `ContactInfo`)
4. Community + GroupDetails (integrare sezioni)
5. Form creazione (`CreateEvent`, `CreateCourse`)
6. Pagine dettaglio (`EventDetails`, `CourseDetails`)
7. MySessions + Search (integrazione)
8. i18n (traduzioni IT/EN)

