# Eventi e corsi sulla mappa

## Problema
La mappa nella tab **Spots** mostra solo gli **spot** (luoghi associati a sessioni). Eventi e corsi non hanno mai marker, anche se hanno coordinate (`latitude`/`longitude`) proprie nelle rispettive tabelle.

## Soluzione
Mostrare anche eventi e corsi come marker distinti sulla stessa mappa.

### 1. Dati
- Usare gli hook esistenti `useEvents` e `useCourses` dentro `src/pages/Spots.tsx`.
- Filtrare solo elementi con `latitude` e `longitude` valorizzati e con `status = 'active'` ed `end_date >= oggi` (così la mappa non si riempie di eventi passati).

### 2. Marker
Estendere `src/components/spots/SpotMap.tsx` accettando due nuovi prop opzionali:
- `events: { id, latitude, longitude, title, start_date }[]`
- `courses: { id, latitude, longitude, title, start_date }[]`

Renderizzare con colori distinti (riusando lo stile `createColoredMarker`):
- Spot: blu/grigio (come ora)
- Eventi: viola (`hsl(270, 70%, 55%)`)
- Corsi: arancione (`hsl(30, 90%, 55%)`)

Click sul marker → `navigate('/events/:id')` o `/courses/:id`.

### 3. Filtri rapidi
Aggiungere due chip nella barra dei quick filter accanto a "Tutti" / "Preferiti":
- **Eventi** (icona Calendar)
- **Corsi** (icona GraduationCap)

Comportamento: i filtri sono additivi (toggle indipendenti). Di default tutti e tre i tipi sono visibili. Disattivando un tipo, i relativi marker spariscono. Il filtro "Preferiti" continua a riguardare solo gli spot.

### 4. Legenda
Piccola legenda compatta in basso a sinistra della mappa con i tre colori, mostrata solo quando più di un tipo è attivo.

## Dettagli tecnici
- Nessuna modifica DB: `events` e `courses` hanno già `latitude`/`longitude` e RLS pubbliche.
- `useEvents`/`useCourses` già caricano i dati necessari; verificare che ritornino le coordinate, altrimenti aggiungerle alla SELECT.
- `SpotMap.tsx`: mantenere `markersRef` separati per tipo (`spotMarkersRef`, `eventMarkersRef`, `courseMarkersRef`) per pulizia/rerender indipendenti.
- Performance: con poche decine di elementi nessun clustering necessario.

## Fuori scopo
- Cluster di marker
- Filtri avanzati per eventi/corsi (data, gruppo)
- Bubble di anteprima al tap (per ora click → pagina dettaglio)
