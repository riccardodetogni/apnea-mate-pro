## Aggiungere Cognome e Data di nascita alla registrazione

### 1. Database

Migrazione su `profiles`:
- aggiungere `last_name TEXT` (nullable)
- aggiungere `birth_date DATE` (nullable)

Aggiornare la funzione trigger `handle_new_user` per leggere anche `last_name` e `birth_date` da `raw_user_meta_data` e scriverli nel profilo appena creato.

Gli utenti esistenti mantengono i due campi a `NULL`: nessuna interruzione, nessuna migrazione di dati.

### 2. Form di registrazione (`src/pages/Auth.tsx`)

Solo in modalità **register**, prima dei campi email/password:
- **Nome** (testo, obbligatorio)
- **Cognome** (testo, obbligatorio)
- **Data di nascita** (`<input type="date">`, obbligatorio)

Validazioni in italiano:
- Nome e Cognome: trim, non vuoti, max 60 caratteri.
- Data di nascita: data valida nel passato; età ≥ 18 anni alla data odierna, altrimenti errore "Devi avere almeno 18 anni per registrarti".

Login invariato (solo email + password).

### 3. `AuthContext.signUp`

Estendere la firma:
```ts
signUp(email, password, { name, lastName, birthDate })
```
Passare i tre valori dentro `options.data` di `supabase.auth.signUp`, così finiscono in `raw_user_meta_data` e il trigger li scrive nel profilo. Aggiornare il tipo del context.

### 4. Utenti esistenti — completamento opzionale dal Profilo

Su `src/pages/Profile.tsx` (o equivalente), se l'utente loggato ha `last_name` **o** `birth_date` a `NULL`, mostrare in alto un banner non-bloccante:

> "Completa il tuo profilo aggiungendo cognome e data di nascita."

Tap → apre un dialog con i due campi (stesse validazioni del form di registrazione, incluso il check 18+ sulla data di nascita). Al salvataggio, aggiorna `profiles.last_name` e `profiles.birth_date`; il banner scompare. L'utente può continuare a usare l'app anche senza completarlo.

### 5. Onboarding

Nessuna modifica. Il campo "Nome" di onboarding resta com'è (precompilato da `profiles.name`).

### Note tecniche
- `birth_date` salvato come `DATE` (no timezone), formato `YYYY-MM-DD` dall'`<input type="date">`.
- Il check 18+ è solo client-side, in linea con le altre validazioni del form.
- Nessun cambio alle RLS di `profiles`.
