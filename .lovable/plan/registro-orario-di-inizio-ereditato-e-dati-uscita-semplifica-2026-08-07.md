# Registro: orario di inizio ereditato e "Dati uscita" semplificati

## Problema

Per gli eventi trip/stage il registro nasce senza orario di inizio: gli eventi salvano solo la data, quindi il campo resta vuoto e va compilato a mano. Inoltre la "Denominazione centro / scuola" è già ricavata dal gruppo organizzatore (es. "Apnea Clan ASD") ma viene chiesta di nuovo come campo editabile, e gli input occupano tutta la larghezza.

## Cosa cambia

1. **Orario ereditato dal programma dell'evento**
   - Quando si crea/aggiorna il programma giornaliero di un evento, l'orario del giorno 1 viene riportato come orario di inizio del registro collegato (solo se il registro non ha già un orario e non è chiuso).
   - Alla creazione del registro, se il programma esiste già, l'orario del giorno 1 viene usato subito.
   - Se il programma non è compilato, il campo resta vuoto e modificabile a mano come oggi.

2. **Denominazione centro / scuola in sola lettura**
   - Non è più un campo da compilare: viene mostrata come riga informativa (valore ereditato dal gruppo organizzatore, oppure "—").
   - Se il registro non ha un gruppo organizzatore e quindi nessuna denominazione, il campo resta editabile per poterla inserire.

3. **Layout compatto**
   - Orario di inizio con larghezza contenuta (non a piena riga), etichette e valori allineati in modo leggibile sulla card scura.

## Dettagli tecnici

- Nuovo trigger su `public.event_schedule` (INSERT/UPDATE): aggiorna `dive_registers.start_time` dal record con `day_number = 1` dell'evento, solo se `start_time IS NULL` e `status <> 'chiuso'`.
- `ensure_register_for_event()`: popola `start_time` dal `event_schedule` del giorno 1 se presente.
- Backfill una tantum per i registri evento esistenti con `start_time` nullo e programma compilato.
- `src/pages/register/RegisterDetail.tsx`: `rdCenterName` reso read-only quando `reg.center_label` è valorizzato; input orario con `w-32`; `handleSaveOutingFields` invia `center_label` solo quando ancora editabile.
- Nessuna modifica alla creazione evento e nessun nuovo campo orario negli eventi.
