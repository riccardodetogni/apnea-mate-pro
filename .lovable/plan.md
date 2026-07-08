# Fix Calendario Sessioni — pagina Gruppo

## Cosa ho letto dal task Notion

Titolo: "Calendario Sessioni scuola" · Bug · Priority Medium · Assegnato a Riccardo.

Due problemi segnalati sulla pagina di dettaglio del gruppo (Ocean Freediving, Sergio Soria):

1. **Sessioni mancanti**: la scuola ha 17 sessioni a giugno + altre nei mesi successivi. Sul calendario ne vediamo meno di 17 a giugno e zero nei mesi successivi.
2. **Colori dei puntini di stato**: quello "Disponibile" quasi non si vede, e "Created by (you)" rischia di scomparire sullo sfondo blu (il giorno selezionato è anch'esso primario/blu).

## Diagnosi

### Bug 1 — è reale
`src/hooks/useGroupDetails.ts` fetcha le sessioni del gruppo con:

```ts
.eq("group_id", groupId)
.eq("status", "active")
.gte("date_time", now())
.order("date_time", { ascending: true })
.limit(5);   // <— hard cap a 5
```

Lo stesso array `sessions` viene passato sia a `GroupSessionsList` (che è ok essere corto) sia al `SessionCalendar` (che così ne vede solo 5 in tutto il futuro). Ecco perché a giugno "spariscono" le sessioni oltre le prime 5 e i mesi dopo restano vuoti.

Bonus: anche `useSessions` (community/AllSessions) ha `.limit(30)`, che è un altro tappo silenzioso — lo segnalo ma non è il difetto denunciato nel task.

### Bug 2 — è reale
In `src/components/sessions/SessionCalendar.tsx` `getStatusConfig()`:

- `available` → `bg-[hsl(var(--muted-foreground))]` (grigio molto tenue sul tema scuro → poco leggibile)
- `created` → `bg-[hsl(var(--primary))]` (blu, uguale al `day_selected: !bg-primary` → il puntino sparisce quando il giorno è selezionato o sull'header blu)

Nel calendario di gruppo, tutte le sessioni sono mappate a `status: "available"` in `GroupDetails.tsx` (riga ~46), quindi tutti i puntini prendono il colore meno visibile.

## Fix proposti

### A. Rimuovere il tappo delle sessioni del gruppo
`src/hooks/useGroupDetails.ts`:
- Dividere in due fetch:
  - `sessionsListLimited` (5, per `GroupSessionsList`) — mantiene la lista compatta
  - `sessionsCalendarAll` — stessa query senza `.limit(5)`, ma con un tetto ragionevole (es. `.limit(500)` come safety net) e finestra temporale limitata a **prossimi 12 mesi** per evitare payload enormi
- Ritornare entrambe dall'hook: `sessions` (invariato) e `calendarSessions`
- `GroupDetails.tsx` costruisce `calendarSessions` dal nuovo array esteso

Alternativa più semplice: un unico fetch senza limit ma con finestra `date_time BETWEEN now AND now+12mo`, e la lista prende `.slice(0, 5)` client-side. Preferisco questa: meno round-trip, meno codice.

### B. Palette puntini di stato ripensata
`SessionCalendar.tsx`:
- `available` → verde acqua/ciano brillante (usa `--info` o un token dedicato) con `ring-1 ring-background` per staccarsi dal fondo blu
- `created` → viola/ambra (non blu) così non si confonde con `day_selected`
- `confirmed` → resta verde success
- `pending` → resta giallo warning
- Sul giorno selezionato: aumentare il contrasto dei puntini aggiungendo un anello bianco (`ring-1 ring-white/70`) così restano visibili anche sopra il cerchio primario

Aggiornare la legenda di conseguenza (usa gli stessi token, quindi si aggiorna da sola).

### C. (Bonus, se vuoi) Alzare/togliere `.limit(30)` in `useSessions`
Impatta AllSessions/Community. Non richiesto dal task — te lo segnalo ma non lo tocco senza tuo ok.

## Il modo corretto secondo me

- **Sessioni calendario**: mai un limite fisso di riga tipo 5; il calendario per definizione mostra tutto il futuro. Finestra temporale (12 mesi) + tetto di sicurezza alto, e la lista visuale sotto il calendario si limita da sola.
- **Colori stato**: due regole
  1. Nessun stato può usare lo stesso hue del `day_selected` (il primario blu è "riservato" alla selezione).
  2. Ogni puntino ha un anello di contrasto (`ring-1 ring-background` o `ring-white/70` quando su cella selezionata) per garantire visibilità su qualsiasi sfondo.

## File toccati

- `src/hooks/useGroupDetails.ts` (query sessioni + tipo di ritorno)
- `src/pages/GroupDetails.tsx` (usa il nuovo array per il calendario)
- `src/components/sessions/SessionCalendar.tsx` (`getStatusConfig`, classi CSS dei puntini, eventuale `ring-` per il giorno selezionato)
- Nessuna migrazione DB, nessun cambio a RLS

## Fuori scope

- Alzare `.limit(30)` in `useSessions` (Community/AllSessions) — te lo propongo separatamente
- Vista mese/lista con contatori per giorno
- Aggiornare la card "task" su Notion (posso farlo se me lo chiedi esplicitamente)