# Fix ordinamento e sessioni passate in My Sessions (e verifica Community)

## Cosa dice il codice oggi

### My Sessions (`useMyParticipations.ts`)
Le due liste "In attesa" e "Confermate" arrivano da questa query:

```ts
supabase.from("session_participants")
  .select("... session:sessions(...)")
  .eq("user_id", userId)
  .in("status", ["pending", "confirmed"])
  .order("joined_at", { ascending: false });
```

Due bug reali:
1. **Nessun filtro sulla data della sessione** → le sessioni già passate restano visibili finché la partecipazione non è cancellata.
2. **Ordinamento per `joined_at`** (data di iscrizione) invece che per `date_time` della sessione → l'ordine visto in UI è "chi si è iscritto più di recente", non "cosa succede prima".

La sezione "Create da te" invece è già corretta (filtra `date_time >= now()` e ordina per `date_time asc`).

### Community (`useSessions.ts` + `Community.tsx`)
- La query DB filtra già `date_time >= now()` e ordina per `date_time asc`: **niente sessioni passate**.
- In `Community.tsx` `getFilteredSortedSessions` poi **ri-ordina per distanza** quando l'utente ha la geolocalizzazione attiva (le più vicine prima, a parità di distanza mantiene l'ordine per data). Quindi non è "per data di iscrizione", ma neppure "per data": è "per vicinanza".

Non trovo un bug sull'ordinamento in Community. Sospetto che la segnalazione esterna confonda i due casi. Confermo comunque i comportamenti sotto.

## Modifiche proposte

### 1. Fix My Sessions (bug certo)
In `src/hooks/useMyParticipations.ts`:
- Rimuovere `.order("joined_at", ...)` sulla query participations.
- Dopo aver enriched i dati, filtrare fuori le sessioni con `session.date_time < now()`.
- Ordinare `participations` per `session.date_time` **ascendente** (la sessione più imminente in cima).

Nessuna modifica al componente `MySessions.tsx` (usa già i due array `pendingParticipations` / `confirmedParticipations` derivati dall'hook).

Effetto: le sezioni "In attesa" e "Confermate" mostrano solo sessioni future, ordinate per data della sessione.

### 2. Community — cosa preferisci? (domanda aperta)
Oggi "Sessions for you" ordina **per distanza** quando hai la geolocalizzazione. Alternative:

- **A. Lasciare così** (nearest-first, poi data). È il default attuale ed è coerente con il filtro "vicino a te".
- **B. Ordinare sempre per data ascendente** e usare la distanza solo per il filtro (`nearbyOnly`).
- **C. Ibrido**: raggruppa per data (Oggi → Domani → prossimi 7 giorni → oltre) e dentro ogni gruppo ordina per distanza.

Non tocco nulla su Community finché non mi dici quale vuoi. Se scegli B o C aggiornerò `Community.tsx` e `AllSessions.tsx` di conseguenza.

## Il modo corretto (mia opinione)

- **My Sessions**: sempre e solo per **data della sessione ascendente**, sessioni passate nascoste. Le persone aprono questa pagina per sapere "cosa devo fare prossimamente".
- **Community "Sessions for you"**: opzione **B** (sempre per data). Il chip "Vicino a te" già gestisce la prossimità come filtro; usare la distanza anche come sort implicito è sorprendente per l'utente e produce l'impressione di "lista disordinata". La distanza resta visibile in card.

## Dettagli tecnici

- File toccati (fase 1): `src/hooks/useMyParticipations.ts`.
- Query participations: rimuovo l'`order` server-side (irrilevante perché rifiltriamo/ordiniamo in memoria dopo l'enrich), filtro `.filter(p => new Date(p.session.date_time) >= now)` prima del `map`, poi `.sort((a,b) => a.session.date_time.localeCompare(b.session.date_time))`.
- Nessuna migrazione DB.
- Fase 2 (Community) parte solo dopo tua scelta A/B/C.

## Fuori scope

- Storico "sessioni passate" in una tab separata (potrebbe essere una feature futura, non richiesta).
- Cambi a Events/Courses (già filtrano per `end_date >= today`).