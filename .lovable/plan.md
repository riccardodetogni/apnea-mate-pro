

# Aggiungere "Pesca subacquea" come tipo di sessione

## Riepilogo

Aggiungere `spearfishing` come nuovo tipo di sessione selezionabile. Serve intervenire in **5 file** dove i tipi sessione sono definiti o mappati.

## File da modificare

### 1. `src/pages/CreateSession.tsx` (riga 47)
- Aggiungere `{ value: "spearfishing", label: "Pesca subacquea" }` all'array `sessionTypes`

### 2. `src/pages/EditSession.tsx` (riga 42)
- Stessa aggiunta all'array `sessionTypes`

### 3. `src/hooks/useSessions.ts` (riga 104)
- Aggiungere `case "spearfishing": return "Pesca subacquea";` nel `mapSessionType`

### 4. `src/pages/SessionDetails.tsx` (riga 71)
- Aggiungere `case "spearfishing": return "Pesca subacquea";` nel `mapSessionType`

### 5. `src/pages/MySessions.tsx` (riga 44)
- Aggiungere `case "spearfishing": return "Pesca sub";` nel `mapSessionType`

### 6. `src/lib/i18n.ts`
- Aggiungere chiave `spearfishing`: IT "Pesca subacquea" / EN "Spearfishing"

## Note tecniche
- Nessuna modifica al database: `session_type` è un campo `text` libero
- Non serve mapping automatico spot→tipo (l'utente seleziona manualmente)
- Le `SessionCard` nella Community e Search usano già il `mapSessionType` di `useSessions.ts`, quindi sono coperte
- I filtri sessione (`SessionFilters`) lavorano su spot/data/pagamento, non sul tipo — nessun impatto

