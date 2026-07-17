## Cosa chiede il task

Il team marketing ha creato in GTM un trigger che ascolta un evento custom `account_activated` sul dataLayer, per far scattare il tag di conversione "Registrazione Completa" (usato nelle ADV). Serve un push dell'evento nel momento esatto in cui l'utente completa la registrazione.

Il codice richiesto è:

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ event: 'account_activated' });
```

## Verifica di correttezza

- GTM è già installato correttamente in `index.html` (container `GTM-P2Q3226K`), quindi `window.dataLayer` esiste già a livello globale.
- Il nome dell'evento va lasciato **esattamente** `account_activated` (case-sensitive, sottolineatura) perché è la stringa che matcha il trigger su GTM.
- Il punto giusto in cui sparare l'evento è `src/pages/Auth.tsx`, dentro `handleSubmit`, nel ramo `mode === "register"`, subito dopo che `signUp(...)` torna senza errore e prima/dopo `setConfirmationSent(true)` (riga 244–247 attuali). È esattamente il momento in cui l'utente atterra sulla schermata "controlla la mail per confermare la registrazione".
- La riga difensiva `window.dataLayer = window.dataLayer || [];` va comunque tenuta, così se in futuro GTM venisse rimosso o bloccato da un ad-blocker il codice non crasha.

## Cosa NON conta come "registrazione completa"

Vale la pena chiarirlo perché cambia dove mettere il push:

- **Ora (proposto):** l'evento parte quando l'API di signup risponde ok, cioè quando l'account è stato creato ma l'email non è ancora stata confermata. È quello che descrive il task ("quando fai atterrare sulla pagina con 'apri la mail'").
- **Alternativa più stringente:** sparare l'evento solo dopo che l'utente clicca il link di conferma nella mail e viene effettivamente loggato (in `AuthContext` sul primo `SIGNED_IN` di un nuovo utente). Più preciso come conversione, ma non è quello richiesto dal task.

Procedo con la prima interpretazione perché è quella esplicitamente indicata. Segnalo l'alternativa perché è tipicamente più utile per l'attribuzione ADV; se serve, la aggiungiamo in un secondo momento.

## Implementazione

Un'unica modifica a `src/pages/Auth.tsx`:

1. Nel blocco `else` di successo del `signUp` (attuale riga 244–247), aggiungere prima di `setConfirmationSent(true)`:

   ```ts
   // GTM: notifica "Registrazione Completa" per il trigger ADV
   window.dataLayer = window.dataLayer || [];
   window.dataLayer.push({ event: "account_activated" });
   ```

2. Aggiungere in cima al file una piccola dichiarazione TypeScript per evitare errori di tipo su `window.dataLayer`:

   ```ts
   declare global {
     interface Window {
       dataLayer?: Array<Record<string, unknown>>;
     }
   }
   ```

Nessun'altra modifica: niente pacchetti nuovi, niente cambi a `index.html`, niente modifiche al backend.

## Come verificare che funziona

1. Aprire l'app, andare su Registrati, completare il form e cliccare "Registrami".
2. Non appena appare la schermata "controlla la mail", aprire la Console del browser e digitare `window.dataLayer` — deve comparire un oggetto `{ event: "account_activated" }` nella lista.
3. In GTM, dalla modalità Anteprima (Preview), confermare che il trigger `account_activated` scatta esattamente una volta in corrispondenza di quella schermata e che il tag "Registrazione Completa" parte.
