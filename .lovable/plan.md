# Piano: Opzione A — Migrazione completa a Lovable Email + nuovo dominio

## Obiettivo

1. Eliminare Resend dalle 3 edge function legacy (session, certification, group notifications) → tutte passano per Lovable Email (queue, retry, suppression, unsubscribe automatici).
2. Aggiornare tutti i link/dominio nelle email da `apnea-mate-pro.com` → `apneamate.com`.

**Prerequisito:** `notify.apneamate.com` deve essere `active` (DNS verificato). Se non lo è ancora, completiamo prima la verifica.

---

## Parte 1 — Aggiornamento dominio (tutti i file)

Sostituire in **6 file**:
- `supabase/functions/auth-email-hook/index.ts` → `SENDER_DOMAIN`, `ROOT_DOMAIN`, `FROM_DOMAIN`
- `supabase/functions/send-transactional-email/index.ts` → `SENDER_DOMAIN`, `FROM_DOMAIN`
- `supabase/functions/_shared/transactional-email-templates/waitlist-confirmation.tsx` → `SITE_URL`
- (le 3 legacy verranno riscritte completamente al punto 2, quindi `APP_URL` sparisce)

Valori nuovi:
- `SENDER_DOMAIN = "notify.apneamate.com"`
- `ROOT_DOMAIN = "apneamate.com"`
- `FROM_DOMAIN = "apneamate.com"`
- `SITE_URL = "https://apneamate.com"`

---

## Parte 2 — Migrazione delle 3 function legacy a Lovable Email

### 2.1 Creare 8 nuovi template React Email

In `supabase/functions/_shared/transactional-email-templates/`:

**Session notifications (3):**
- `session-join-request.tsx` → notifica al creator: "X vuole partecipare a Y"
- `session-request-approved.tsx` → notifica al partecipante: approvato 🎉
- `session-request-rejected.tsx` → notifica al partecipante: rifiutato

**Certification (2):**
- `certification-approved.tsx` → certificazione approvata, nuovo ruolo
- `certification-rejected.tsx` → certificazione rifiutata, motivo opzionale

**Group (3):**
- `group-request-received.tsx` → all'owner: nuova richiesta di adesione
- `group-request-approved.tsx` → al richiedente: benvenuto nel gruppo
- `group-request-rejected.tsx` → al richiedente: richiesta rifiutata

Ogni template:
- Branded con palette Deep Blue Gradient (semantic tokens dell'app)
- Body background bianco (regola tassativa Lovable Email)
- Logo da `https://vjvhaegbfjepysptcygz.supabase.co/storage/v1/object/public/email-assets/apnea-mate-logo.png`
- CTA button con link a `https://apneamate.com/...`
- Tipato con `TemplateEntry` + `previewData` di esempio
- Subject dinamico (es: `(data) => "Nuova richiesta per " + data.sessionTitle`)

### 2.2 Registrare gli 8 template

Aggiornare `_shared/transactional-email-templates/registry.ts` per importare e mappare tutti i template.

### 2.3 Riscrivere le 3 edge function legacy

Ogni function diventa **un fetcher di dati + un invoke a `send-transactional-email`**. Niente più `fetch` a Resend, niente più HTML inline.

**Pattern per ognuna:**
```ts
// 1. Fetch dati (session/group/profile) come oggi
// 2. Build templateData con i campi necessari
// 3. supabase.functions.invoke('send-transactional-email', {
//      body: {
//        templateName: '<kebab-case-name>',
//        recipientEmail,
//        idempotencyKey: `<type>-<id>`,
//        templateData: { ... }
//      }
//    })
// 4. Return success
```

**Mantieni le firme HTTP esistenti** (stesso request/response shape) → nessuna modifica nel client. I caller esistenti (es. quando un admin approva una certificazione, quando un user manda join request) continuano a funzionare senza modifiche.

### 2.4 Deploy

Deploy delle 4 edge function modificate in un colpo solo:
- `send-transactional-email` (nuovo dominio + nuovi template registrati)
- `send-session-notification`
- `send-certification-notification`
- `send-group-notification`
- `auth-email-hook` (nuovo dominio)

---

## Parte 3 — Cleanup

- **NON** rimuovere subito i secrets `RESEND_API_KEY` e `RESEND_FROM_EMAIL` (li lasciamo come backup per 1-2 settimane in caso di rollback). Una volta verificato che tutto funziona, potrai eliminarli da Cloud → Secrets.
- Le 3 function legacy non chiamano più Resend → l'API key resta inutilizzata.

---

## Parte 4 — Aggiornare la memory

Aggiornare la core memory: dominio principale passa da `apnea-mate-pro.com` → `apneamate.com`.

---

## Vantaggi finali

| Prima | Dopo |
|---|---|
| 2 sistemi email (Lovable + Resend) | 1 solo sistema (Lovable Email) |
| 2 domini mittenti diversi | 1 dominio (`notify.apneamate.com`) |
| Notifiche sessione: no retry, no suppression, no unsubscribe | Tutto incluso automaticamente |
| Link email puntano al vecchio dominio | Tutti su `apneamate.com` |
| 2 secret da gestire | 0 secret email-related lato Resend |

---

## Cosa NON cambia

- Il codice client/UI che chiama le edge function (stesse firme)
- I subject e tono di voce delle email (stesso wording italiano)
- L'auth-email-hook (solo costanti dominio aggiornate)
- I domini custom del frontend (`apnea-mate-pro.com` resta connesso come alias finché vuoi)

---

## Checklist verifica post-deploy

1. Crea una sessione di test → richiedi adesione da altro account → verifica che arrivi email da `notify@notify.apneamate.com`
2. Approva la richiesta → verifica email approvazione
3. Controlla `email_send_log` per status `sent`
4. Click sul CTA → deve aprire `https://apneamate.com/sessions/...`
5. Footer unsubscribe → deve linkare a `https://apneamate.com/unsubscribe?token=...`

---

## Tempo stimato

- Parte 1 (dominio): 5 min
- Parte 2 (8 template + 3 function): 20-30 min
- Deploy + verifica: automatico

Confermi di procedere?
