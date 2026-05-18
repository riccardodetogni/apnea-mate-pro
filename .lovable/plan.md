## Goal

Publish the lawyer's GDPR informativa on `/privacy` (IT master + EN translation) and align the onboarding consent checkboxes with the legal bases declared in that document.

## Confirmed data

- **Titolare**: Apnea Mate S.r.l.
- **Sede legale**: Via Mazzini 37, 13836 Cossato (BI), Italy
- **P.IVA / C.F.**: 02847820020
- **Contact e-mail**: `privacy@apneamate.com` (to be created as an alias on the domain — see note at the end)
- **Ultimo aggiornamento**: date of deploy (auto-rendered, e.g. "18 maggio 2026")

## 1. Privacy page — `/privacy`

Rewrite `src/pages/PrivacyPolicy.tsx` to render the structured informativa from typed translation keys (no more `whitespace-pre-line` blob). Sections, in order:

1. Titolare del trattamento (with company, address, VAT, e-mail inline)
2. Tipologie di dati trattati (identificativi, contatto, altri — incl. note on art. 9 GDPR exclusion)
3. Finalità del trattamento e basi giuridiche
   - 3.1 Finalità di Legge — art. 6(1)(c), conferimento obbligatorio
   - 3.2 Finalità Contrattuali — art. 6(1)(b), conferimento necessario
   - 3.3 Finalità Commerciali/di Marketing — art. 6(1)(a), facoltativo, revocabile, no profilazione
4. Modalità del trattamento e misure di sicurezza
5. Destinatari dei dati personali (dipendenti art. 29, responsabili art. 28, titolari autonomi)
6. Trasferimento dei dati verso Paesi extra SEE (artt. 44–49 GDPR)
7. Periodo di conservazione (need-to-store, art. 2946 c.c., marketing max 24 mesi)
8. Diritti dell'interessato (artt. 15, 16, 17, 18, 20, 21, 22)

Remove the orange "Contenuto provvisorio" notice banner. Show "Ultimo aggiornamento" at the bottom. Add `<title>` + meta description per language for SEO.

## 2. i18n — `src/lib/i18n.ts`

Replace the existing privacy keys (currently one `privacyPolicyPlaceholderBody` blob) with a structured `privacyPolicy` object in both `it` and `en`. Italian is the legally binding version; the EN page header will include a small note: "Unofficial translation — the Italian version prevails."

```ts
privacyPolicy: {
  pageTitle, lastUpdated, langDisclaimer,
  controllerTitle, controllerBody (with {company}, {address}, {vat}, {email}),
  dataTypesTitle, dataTypesIntro,
  dataTypesIdentificativiLabel/Body,
  dataTypesContattoLabel/Body,
  dataTypesAltriLabel/Body,
  dataTypesExclusion,
  purposesTitle,
  legalPurposeTitle, legalPurposeBody, legalPurposeBasis, legalPurposeMandatory,
  contractualPurposeTitle, contractualPurposeList[…], contractualPurposeBasis, contractualPurposeMandatory,
  marketingPurposeTitle, marketingPurposeIntro, marketingPurposeList[…],
  marketingPurposeBasis, marketingPurposeOptional, marketingPurposeRevoke, marketingPurposeNoProfiling,
  securityTitle, securityBody,
  recipientsTitle, recipientsList[…],
  transfersTitle, transfersBody,
  retentionTitle, retentionBody, retentionMarketing, retentionEnd,
  rightsTitle, rightsList[…]   // 7 articles
}
```

Drop the old `privacyPolicyPlaceholderNotice` / `privacyPolicyPlaceholderBody` keys after switching `PrivacyPolicy.tsx`.

## 3. Onboarding consent checkboxes — `src/pages/Onboarding.tsx`

Current step has five toggles (A informativa, B platform use, C service comms, D marketing, E compliance acknowledgement). Under the new informativa B/C/E aren't consent-based — they fall under art. 6(1)(b) and art. 6(1)(c), so requiring checkboxes there is legally incorrect and dilutes the marketing consent.

New, lawyer-aligned structure:

- **Mandatory** (gates "Continue"):
  - "Dichiaro di aver letto e compreso l'Informativa Privacy" → link to `/privacy`
- **Optional, independent**:
  - "Acconsento al trattamento dei miei dati per Finalità Commerciali/di Marketing (newsletter, promozioni, eventi di Apnea Mate e dei suoi partner). Posso revocare il consenso in qualsiasi momento dalle impostazioni del profilo."

State changes:
- Keep `privacyPolicyAccepted`, `privacyMarketing`.
- Remove `privacyPurpose1`, `privacyPurpose2`, `privacyCompliance`.
- `privacyComplete = privacyPolicyAccepted`.
- Continue writing `marketing_consent` to the profile (column already exists).

Update step intro copy to: "L'iscrizione richiede solo l'accettazione dell'informativa. Il consenso al marketing è facoltativo e revocabile in qualsiasi momento."

## 4. Marketing-consent toggle in Profile

`src/pages/Settings.tsx` is currently empty — instead, add the toggle to `src/pages/Profile.tsx` Settings card (where the other switches already live: insurance, search visibility, language). New row:

- Icon (Mail), label "Marketing e newsletter" / "Marketing & newsletter".
- Switch bound to `profiles.marketing_consent` via `updateProfile`.
- Sub-label: "Puoi revocare il consenso in qualsiasi momento." with link "Informativa Privacy" → `/privacy`.

This satisfies the lawyer's requirement of an "apposita e univoca sezione dedicata" for giving/revoking marketing consent.

## 5. Coming Soon waitlist page

The waitlist form already shows a small disclosure line. Update IT/EN copy to:

- IT: "Iscrivendoti accetti il trattamento dei dati per la sola finalità di gestione della lista d'attesa, come descritto nell'[Informativa Privacy](/privacy)."
- EN: "By signing up you agree to the processing of your data for the sole purpose of managing the waitlist, as described in the [Privacy Policy](/privacy)."

No checkbox needed (single-purpose, transparent notice). Make sure the link points to `/privacy`.

## 6. Out of scope (flagged for follow-up)

- **Cookie banner / cookie policy** — the lawyer's document doesn't cover cookies. If any analytics or tracking cookies are loaded (now or later), a separate cookie informativa + consent banner is required. Want me to plan this next?
- **Termini di Servizio** — separate document, not addressed here.

## Technical notes

- Type the new `privacyPolicy` block as `const` and pass a `lang`-bound copy to `PrivacyPolicy.tsx`; render sections with semantic `<section>` / `<h2>` / `<h3>` / `<ul>`. "Base giuridica" and "Carattere del conferimento" rendered as bold inline labels.
- String interpolation in `controllerBody` (company / address / VAT / e-mail) done with a simple `.replace("{email}", …)` helper rather than introducing a new dep.
- No DB migration: `profiles.marketing_consent` already exists.
- No edge function changes.

## Operational follow-up (you, not code)

Create the `privacy@apneamate.com` alias on your domain mail provider before launch and forward it to whichever inbox you actually check. If you'd rather use a different address, just tell me and I'll swap it in the i18n strings.

Ready to implement when you approve.
