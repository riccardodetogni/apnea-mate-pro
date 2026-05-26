# Bubble per eventi/corsi e gestione marker sovrapposti

## Problema
1. Tappando un marker evento/corso si va dritti alla pagina di dettaglio, mentre per gli spot si apre prima una bubble in basso con anteprima.
2. Se uno spot (con sessione) e un evento/corso si trovano nello stesso luogo (stesse coordinate), i marker si sovrappongono e quello sotto non è cliccabile.

## Soluzione

### 1. Bubble unificata
Estendere il pattern di `SpotBubble` per supportare anche eventi e corsi.

- Creare `MapItemBubble` (o estendere `SpotBubble` con varianti) che mostri:
  - **Spot** (come ora): emoji ambiente, nome, location, "sessioni disponibili", cuore preferiti.
  - **Evento**: icona Calendar viola, titolo, location, data (`start_date` formattata), nessun cuore.
  - **Corso**: icona GraduationCap arancione, titolo, location, data, nessun cuore.
- Tap sulla bubble → naviga alla pagina di dettaglio (`/spots/:id`, `/events/:id`, `/courses/:id`).
- Tap fuori dal marker → chiude la bubble (già implementato per spot).

### 2. Stato di selezione unificato in `Spots.tsx`
Sostituire `selectedSpotId?: string` con:
```ts
selected?: { type: 'spot' | 'event' | 'course'; id: string }
```
Gli handler `onSelectEvent`/`onSelectCourse` in `SpotMap` non navigheranno più, ma chiameranno un callback che aggiorna lo stato. La pagina di dettaglio si apre solo dal tap sulla bubble.

### 3. Highlight del marker selezionato
Estendere `SpotMap` perché anche i marker evento/corso supportino lo stato selezionato (stesso ingrandimento + bordo più scuro già usato per gli spot). Passare a `extraMarkersRef` l'id selezionato corrente.

### 4. Marker sovrapposti (stessa location)
Per evitare che marker nello stesso punto si nascondano:
- **Offset visivo automatico**: quando 2+ elementi (di qualsiasi tipo) hanno coordinate identiche (o entro ~5m), distribuirli su un piccolo arco attorno al punto reale (offset di ~10–15 px a seconda dello zoom). Algoritmo semplice: raggruppare per `"${lat.toFixed(5)},${lng.toFixed(5)}"`, e se il gruppo ha N>1 elementi, spostarli su un cerchio di raggio fisso (calcolato in gradi dal livello di zoom corrente).
- L'offset viene applicato solo alla posizione visiva del marker; la bubble e la navigazione usano comunque l'id originale.
- I marker restano tutti cliccabili individualmente.

Alternativa più semplice (se l'offset risulta complesso): all'inizializzazione di Leaflet usare l'opzione `riseOnHover: true` e dare un piccolo z-index incrementale ai marker successivi nello stesso punto, così almeno tappando ripetutamente si riesce a raggiungere ognuno. Si parte con questa, l'offset arriva solo se serve davvero.

## Dettagli tecnici
- **File modificati**: `src/components/spots/SpotMap.tsx`, `src/components/spots/SpotBubble.tsx` (rinominato o affiancato da `MapItemBubble.tsx`), `src/pages/Spots.tsx`.
- **Hook**: `useEvents`/`useCourses` già forniscono `start_date` e `location`, non servono modifiche DB.
- **Colori**: riusare quelli già definiti (viola eventi, arancione corsi).
- **i18n**: aggiungere le poche stringhe necessarie ("Vedi evento", "Vedi corso") al file `src/lib/i18n.ts`.

## Fuori scopo
- Bubble multipla che mostri più elementi quando coincidono (es. lista a scorrimento): per ora un solo elemento selezionato alla volta.
- Cluster di marker.
- Preview con immagine di copertina nella bubble.
