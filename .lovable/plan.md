## Obiettivo
Nella schermata di registrazione (`/auth` in modalità "register"), inserire un messaggio statico chiaro che informi l'utente che i dati richiesti (nome, cognome, data di nascita, email) sono della persona fisica e non della scuola o del gruppo. Specificare inoltre che la creazione di scuola/gruppo sarà possibile solo dopo la registrazione, direttamente dal proprio profilo.

## Modifiche richieste

### 1. Traduzioni (`src/lib/i18n.ts`)
Aggiungere le seguenti chiavi sia nella sezione `it` che `en`:

- `registerPersonalInfoTitle`: "Dati personali"
- `registerPersonalInfoDesc`: "Inserisci i tuoi dati personali. Dopo la registrazione potrai creare la tua scuola o il tuo gruppo direttamente dal profilo."

### 2. UI Registrazione (`src/pages/Auth.tsx`)
Nella vista `mode === "register"`, posizionare sotto il sottotitolo (`registerSubtitle`) un blocco informativo statico:
- Contenitore con `bg-card/50`, `border`, `rounded-xl`, `p-3`
- Testo in `text-sm text-muted-foreground`
- Titoletto in `text-xs font-semibold text-foreground uppercase tracking-wide` (o simile, coerente con il design system)
- Icona opzionale `Info` da lucide-react per catturare l'attenzione
- Nessuna interazione (no checkbox, no pulsante)

### 3. Styling
- Rispettare il design system esistente: usare solo token semantici (nessun colore hardcoded)
- Il blocco deve essere visibile ma non invasivo, adatto alla viewport mobile (max-width 380px del form)

## Note
- Non modificare la logica di registrazione, i campi esistenti, o il flusso di onboarding.
- Non aggiungere nuovi componenti condivisi: la modifica è locale alla pagina Auth.