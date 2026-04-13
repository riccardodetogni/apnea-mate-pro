
# Fix: rimuovere header duplicato "Prossime sessioni"

## Problema
Il titolo "Prossime sessioni" appare due volte nella pagina dettaglio gruppo. Sia `GroupDetails.tsx` (riga 224) sia `GroupSessionsList.tsx` (righe 29 e 39) renderizzano lo stesso `<h3>{t("upcomingSessions")}</h3>`.

## Soluzione
Rimuovere l'header interno da `GroupSessionsList.tsx` (righe 29 e 39), lasciando quello in `GroupDetails.tsx` che include anche i toggle lista/calendario.

### Modifiche
**`src/components/groups/GroupSessionsList.tsx`**
- Rimuovere `<h3>` su riga 29 (caso empty) e riga 39 (caso con sessioni)
- Il container `space-y-3` resta, ma senza il titolo duplicato
