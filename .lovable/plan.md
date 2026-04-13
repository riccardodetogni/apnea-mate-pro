

# Fix hardcoded Italian text across the app

## Problem
Many UI strings are hardcoded in Italian instead of using the `t()` translation function. When the user switches to English, these strings remain in Italian.

## Affected files and strings

### 1. `src/pages/Create.tsx`
5 hardcoded `description` fields:
- "Organizza un allenamento o uscita"
- "Stage, gare o trip multi-giorno"
- "Corso di apnea per la tua scuola"
- "Crea un gruppo locale di apneisti"
- "Registra il tuo allenamento personale"

### 2. `src/pages/CreateSession.tsx`
- `sessionTypes` labels: "Uscita mare", "Piscina", "Piscina profonda", "Uscita lago", "Allenamento", "Pesca subacquea"
- `levels` labels: "Tutti i livelli", "Principiante", "Intermedio", "Avanzato"
- Page title "Nuova sessione"
- "Certificazione richiesta" block text
- "Nessun gruppo" select item
- "Tipo sessione", "Max partecipanti" labels
- Toast messages (Errore, Inserisci un titolo, Seleziona uno spot, etc.)
- Placeholder "Es: Allenamento profondità", "Dettagli aggiuntivi..."

### 3. `src/pages/EditSession.tsx`
- Same `sessionTypes` and `levels` arrays (duplicated)
- "Modifica sessione" title
- "Non autorizzato" / "Solo il creatore può modificare" text
- "Tipo sessione", "Max partecipanti" labels
- "Salva modifiche" button
- Toast messages

### 4. `src/pages/CreateEvent.tsx`
- Placeholders: "Es. Deep Week Sardegna", "Descrivi l'evento...", "Email di contatto", "Telefono", "Link per info", "Titolo giornata", "Dettagli"
- Toast messages: "Compila tutti i campi obbligatori", "Evento creato!", "Errore"
- "Aggiungi giornata" button text

### 5. `src/pages/CreateCourse.tsx`
- Placeholders: "Es. Corso Apnea 1° Livello", "Descrivi il corso...", "Email per iscrizioni", "Telefono", "Link sito scuola"
- Toast messages: "Compila tutti i campi obbligatori", "Corso creato!", "Errore"

### 6. `src/pages/EventDetails.tsx`
- Toast messages: "Errore", "Richiesta inviata!", "Iscrizione annullata", "Link copiato!", "Impossibile aprire la chat"

### 7. `src/pages/CourseDetails.tsx`
- Toast messages: same as EventDetails

### 8. `src/pages/SessionDetails.tsx`
- All toast messages (~15): "Già richiesto", "Sessione piena", "Ti sei iscritto!", "Richiesta inviata!", "Approvato!", "Rifiutato", "Sessione annullata", "Partecipazione annullata", etc.

### 9. `src/pages/Onboarding.tsx`
- Toast messages: "Posizione rilevata", "Nome richiesto", "Località richiesta", "Agenzia richiesta", "Livello richiesto"
- Placeholder "Mario Rossi", "Racconta qualcosa di te..."
- "Carica documento" label
- "Altro" in certificationAgencies array

### 10. `src/pages/Admin.tsx`
- Toast: "Accesso negato", "Impossibile aggiornare il ruolo/stato"
- "Modifica ruolo" dialog title
- SelectItems: "Utente", "Apneista Certificato", "Istruttore"

### 11. `src/pages/DiscoverFreedivers.tsx`
- "Scopri apneisti" title
- "Cerca apneisti..." placeholder

### 12. `src/pages/MySessions.tsx`
- "Nessuna sessione" empty state text

### 13. `src/pages/Groups.tsx`
- Toast messages: "Devi accedere per unirti", "Richiesta inviata", "In attesa di approvazione", "Iscrizione effettuata!"

### 14. `src/pages/GroupManage.tsx`
- "Gestisci gruppo" title, "Nessun membro"

### 15. `src/components/sessions/SessionCalendar.tsx`
- `statusConfig` labels: "Confermato", "In attesa", "Creata da te", "Disponibile"

### 16. `src/components/spots/SpotCreator.tsx`
- "Nuovo spot", "Tipo ambiente", "Cerca indirizzo" labels
- Environment type labels: "Mare", "Piscina", "Piscina profonda", "Lago"

### 17. `src/components/certification/CertificationForm.tsx`
- "Invia certificazione", "Sarà verificata dal nostro team"

### 18. `src/components/certification/CertificationStatus.tsx`
- Status labels: "Non inviata", description texts

### 19. `src/pages/Community.tsx`
- EmptyCard: "Nessun altro gruppo da unirsi.", "Nessun gruppo disponibile.", "Crea un gruppo"

## Plan

### Step 1: Add ~80 new translation keys to `src/lib/i18n.ts`
Add all missing keys for both `it` and `en` sections, covering toast messages, labels, placeholders, descriptions, and status config.

### Step 2: Replace hardcoded strings in all 19 files listed above
Replace each Italian string with `t("keyName")`. For components that need reactive language switching, ensure they use `useLanguage()` context where needed.

### Step 3: Deduplicate `sessionTypes` and `levels` arrays
Extract them as functions that return translated labels (since `t()` depends on current language), avoiding duplication between CreateSession and EditSession.

This is a large but mechanical change across ~19 files + i18n.ts.

