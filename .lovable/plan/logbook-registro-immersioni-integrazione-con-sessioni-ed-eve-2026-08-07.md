# Logbook + Registro immersioni: integrazione con sessioni ed eventi

Audit completo (UI + database) della feature registro/libretto e del suo aggancio a sessioni, eventi e gruppi. Il problema principale non è il registro in sé, ma il fatto che nasca "invisibile": viene creato da trigger sul database e nessuna schermata di sessione o evento lo mostra.

## Problemi trovati (in ordine di impatto)

**Aggancio mancante**
- Sessioni ed eventi non hanno nessun link al registro: l'istruttore deve indovinare quale registro corrisponde alla sua uscita cercandolo per titolo e data.
- Il partecipante si ritrova un'immersione nuova nel libretto senza sapere da dove arriva: nessun riferimento alla sessione/evento di origine.
- Sui registri di evento manca il pulsante "Importa partecipanti": chi conferma la partecipazione dopo la creazione del registro non può essere aggiunto se non a mano.

**Dati che si disallineano**
- Se si modifica data, ora o spot di una sessione (o il programma di un evento), il registro già aperto resta con i dati vecchi.
- Se un gruppo viene verificato dopo la creazione del registro, il registro non risulta intestato alla scuola.
- Cancellare un evento distrugge l'intero registro (partecipanti e responsabili inclusi); cancellare una sessione invece lo lascia scollegato. Comportamenti opposti e non voluti. Su registri chiusi la cancellazione dell'evento va addirittura in errore.
- Restano libretti "orfani" senza registro dopo queste cancellazioni.

**Chiusura e firme**
- Oggi si può chiudere un registro lasciando presenti non firmati, e dopo la chiusura non si può più rimediare: 3 registri chiusi hanno 6 partecipanti presenti senza firma.

**UX e piccoli difetti**
- In "Crea registro" i campi "numero responsabili" e "partecipanti attesi" vengono compilati dall'utente e poi ignorati.
- La denominazione centro/scuola, una volta impostata, non è più correggibile e sparisce senza spiegazione.
- L'orario di inizio salvato come `HH:MM` invece di `HH:MM:SS` può far fallire silenziosamente il controllo "uscita iniziata" che abilita la firma.
- La ricerca membri interroga tutti i profili della piattaforma a ogni tasto premuto, senza debounce né limitazione al gruppo/sessione.
- Data di nascita ospite senza controllo (accetta date future).
- Uno stato residuo "da aprire" non più raggiungibile dopo l'apertura automatica.
- Piccole incoerenze i18n (fallback in italiano dentro `t()`, plurali scritti a mano).
- Due registri di eventi senza orario di inizio perché l'evento non aveva un programma di giorno 1.

## Cosa faremo

### 1. Rendere il registro visibile dalle sessioni e dagli eventi
- Card "Registro immersioni" su dettaglio sessione ed evento, visibile solo a staff/responsabili, con stato (aperto/chiuso), numero di partecipanti e firme, e link diretto al registro.
- Nuova query per trovare il registro dalla sessione/evento.
- Sul dettaglio del libretto: riferimento all'uscita di origine con link, così il partecipante capisce da dove arriva l'immersione.
- Aggiunto "Importa partecipanti dall'evento", equivalente a quello già presente per le sessioni.

### 2. Sincronizzazione automatica sessione/evento → registro aperto
- Alla modifica di una sessione (data/ora/spot/titolo) o di un evento (data/luogo/titolo/programma giorno 1), il registro aperto si aggiorna e propaga ai libretti non ancora firmati (i registri chiusi restano immutabili).
- Se un gruppo diventa verificato, i registri aperti dei suoi istruttori vengono intestati alla scuola.
- Backfill dell'orario di inizio mancante sui due registri di evento.

### 3. Coerenza delle cancellazioni
- Evento cancellato: il registro non viene più distrutto, viene scollegato (come già succede per le sessioni), conservando il valore legale e la retention.
- Pulizia dei libretti orfani rimasti e prevenzione dei casi futuri.

### 4. Chiusura registro con avviso
- Prima di chiudere, se ci sono presenti non firmati: avviso con il numero esatto e conferma esplicita ("Chiudi comunque"). La chiusura resta permessa.
- Suggerimento nel dialogo: firma di gruppo o passaggio dei mancanti ad "assente".

### 5. Pulizia UX
- Rimozione dei campi non funzionanti in "Crea registro".
- Denominazione centro/scuola modificabile dal responsabile, con nota che il valore arriva dal gruppo.
- Normalizzazione degli orari a `HH:MM:SS`.
- Debounce sulla ricerca membri e priorità a partecipanti della sessione / membri del gruppo.
- Data di nascita ospite non nel futuro.
- Rimozione dello stato "da aprire" da tipi e UI.
- Chiavi i18n mancanti e plurali uniformati.

## Fuori scopo (da fare in produzione)
Il backfill dei registri per le 100 sessioni passate create prima dell'introduzione della feature non verrà eseguito in staging: sarà un'attività separata sull'ambiente di produzione.

## Note tecniche
- Migrazioni: nuovi trigger `AFTER UPDATE` su `sessions`, `events`, `event_schedule`, `groups`; FK `dive_registers.event_id` da `ON DELETE CASCADE` a `SET NULL`; cleanup dei `dive_logs` con `register_id` NULL e nessun partecipante collegato; backfill `start_time`.
- File frontend: `src/pages/SessionDetails.tsx`, `src/pages/EventDetails.tsx`, `src/pages/register/RegisterDetail.tsx`, `CreateRegister.tsx`, `AddGuest.tsx`, `src/pages/DiveLogDetail.tsx`, `src/hooks/useDiveRegisters.ts`, `useSigning.ts`, `src/lib/i18n.ts`.
- Correzione chiave di invalidazione morta `["dive_register_detail", …]` in `useSigning.ts` e invalidazione della lista registri dopo le firme.
- Nessuna modifica ai file autogenerati; le migrazioni seguono il formato `<timestamp>_nome.sql`.
