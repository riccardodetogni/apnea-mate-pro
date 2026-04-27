Confermo: l’immagine è una sessione, non un evento. Il problema va quindi gestito anche sulle sessioni.

Ho verificato il codice: nelle card della Community viene mostrato `6/6 posti`, ma il pulsante resta comunque cliccabile perché oggi, quando una sessione è piena, il click viene trasformato in “dettagli” invece di mostrare chiaramente uno stato non iscrivibile. Inoltre in alcuni conteggi della Community vengono considerati solo i confermati, mentre la capienza reale dovrebbe riservare anche le richieste in attesa.

Piano di intervento:

1. Bloccare le sessioni piene nella Community
   - Considerare pieni i posti quando `confermati + in attesa >= max_participants`.
   - Cambiare la card da `6/6 posti` a uno stato più chiaro tipo `Al completo`.
   - Disabilitare/neutralizzare il pulsante di iscrizione e mostrarlo come `Al completo`, con colore/variant non primaria.
   - Evitare che il click sul pulsante apra il popup di warning quando la sessione è piena.

2. Rafforzare la pagina dettaglio sessione
   - Mantenere il bottone disabilitato quando la sessione è piena.
   - Aggiungere un controllo preventivo in `handleJoinRequest` e `confirmJoin`, così anche se i dati cambiano nel frattempo non si procede con il popup o con l’invio richiesta.
   - Mostrare toast localizzato: “Sessione al completo / Non ci sono più posti disponibili”.

3. Allineare Spot Details
   - Nella lista sessioni dentro la pagina spot, mostrare chiaramente `Al completo` quando `current_participants >= max_participants`.
   - Non mostrare il bottone `Iscriviti` per sessioni piene.
   - Usare le chiavi i18n invece di stringhe hardcoded dove possibile.

4. Sistemare i testi e le traduzioni IT/EN
   - Aggiungere/riusare chiavi come `fullShort`, `sessionFullButton`, `spotsLeftText`.
   - Sostituire testi hardcoded ancora in italiano nella pagina dettaglio sessione, inclusi `confermati`, messaggi stato personale e “posti rimasti”.

5. Eventi e corsi: coerenza UX
   - Applicare lo stesso pattern anche a eventi/corsi dove c’è un `max_participants`.
   - Se pieni: bottone non cliccabile o messaggio “Evento al completo” / “Corso al completo”.
   - Le card mostreranno `Al completo` invece di “0 posti”.

6. Backend safety
   - Le sessioni hanno già un trigger backend di capienza, ma il bug principale è lato UX/conteggi.
   - Per eventi/corsi, se non esiste ancora una protezione equivalente, aggiungerò una migrazione con controllo capienza per evitare race condition e iscrizioni oltre limite anche se qualcuno bypassa la UI.

Nota su lista d’attesa:
- La lista d’attesa è una buona evoluzione futura, ma la terrei separata da questo fix. Prima blocchiamo correttamente i “posti al completo”; poi possiamo progettare una waitlist con stato dedicato e notifiche.