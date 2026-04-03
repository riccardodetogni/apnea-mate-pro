

# Fix filtri sessione e data mancante nelle card

## Problemi trovati

1. **Filtri non funzionano**: `applySessionFilters` fa `new Date(s.dateTime)` ma `dateTime` è già formattato come `"Oggi · 10:00 · 2h"` — non è una data parsabile. Serve il campo `date_time` raw ISO.

2. **Data mancante nelle card**: `formatSessionDateTime` mostra solo il giorno abbreviato ("Lun", "Mar") senza il numero e mese (es. "Lun 15 Apr").

## Modifiche

### 1. `src/hooks/useSessions.ts`
- Aggiungere `rawDateTime: string` all'interfaccia `SessionWithDetails`
- Nel mapping `formattedSessions`, aggiungere `rawDateTime: session.date_time`
- Modificare `formatSessionDateTime` per includere giorno e mese quando la data è oltre domani: `"Lun 15 Apr · 10:00 · 2h"` invece di `"Lun · 10:00 · 2h"`

### 2. `src/pages/Community.tsx`
- In `applySessionFilters`, cambiare `new Date(s.dateTime)` → `new Date(s.rawDateTime)` (riga 264)

## Dettagli tecnici

La funzione `formatSessionDateTime` attualmente fa:
```
dayStr = days[date.getDay()]; // "Lun"
```
Diventerà:
```
const day = date.getDate();
const months = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
dayStr = `${days[date.getDay()]} ${day} ${months[date.getMonth()]}`;
// "Lun 15 Apr"
```

Nessuna modifica al database.

