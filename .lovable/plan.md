# Restore 5-checkbox Privacy step in Onboarding

## Background

Yesterday's privacy-policy work (msg #808, May 18) simplified the Privacy step from **5 checkboxes → 2** and deleted the supporting i18n keys (`privacyPurpose1`, `privacyPurpose2`, `privacyCompliance`). This plan restores the original five-checkbox structure while keeping the lawyer-approved Privacy Policy page and `marketing_consent` profile field intact.

## Target structure (Onboarding step 6)

Five checkboxes, each in its own bordered row:

| # | Label key | Required? | Gates Continue? |
|---|---|---|---|
| A | `privacyCheckboxA` (acknowledgement of Informativa Privacy, with link) | yes | yes |
| B | `privacyPurpose1` (consent to platform use / account management) | yes | yes |
| C | `privacyPurpose2` (consent to service communications) | yes | yes |
| D | `privacyMarketingCheckbox` (marketing/newsletter) | no | no |
| E | `privacyCompliance` (acknowledgement of safety rules & community guidelines) | yes | yes |

## Changes

### 1. `src/lib/i18n.ts`
Re-add the three deleted keys in both `it` and `en` blocks, near the existing `privacyCheckboxA_part1` group:

- `privacyPurpose1` — IT: "Acconsento al trattamento dei miei dati personali per la creazione e gestione del mio account su Apnea Mate." / EN equivalent.
- `privacyPurpose2` — IT: "Acconsento a ricevere comunicazioni di servizio relative al funzionamento della piattaforma (conferme di prenotazione, notifiche di sicurezza, aggiornamenti operativi)." / EN equivalent.
- `privacyCompliance` — IT: "Dichiaro di aver compreso e mi impegno a rispettare le regole di sicurezza dell'apnea e le linee guida della community di Apnea Mate." / EN equivalent.

Also tweak `privacyImportantDesc` to reflect that multiple consents are required (not "only" the policy).

### 2. `src/pages/Onboarding.tsx`
- Add three state vars: `privacyPurpose1`, `privacyPurpose2`, `privacyCompliance` (all booleans, default `false`).
- Update `privacyComplete` to `privacyPolicyAccepted && privacyPurpose1 && privacyPurpose2 && privacyCompliance` (marketing stays excluded).
- Render the three new checkboxes between checkbox A and the Marketing row, mirroring the existing styling. Order: A → B (purpose1) → C (purpose2) → E (compliance) → D (marketing/optional).
- `handleComplete` keeps writing `marketing_consent: privacyMarketing` (no new DB fields — these acknowledgements are gates only, not stored).
- Final-button `disabled` already uses `!privacyComplete`, so it picks up the stricter rule automatically.

### 3. Memory update
Update `mem://features/onboarding-flow-steps` to note that step 6 = Privacy with 5 checkboxes (A mandatory + B/C purpose + E compliance gate Continue, D marketing optional).

## Out of scope

- `PrivacyPolicy.tsx` page content (lawyer version stays).
- `Profile.tsx` marketing toggle (stays).
- DB schema — no new columns; the three re-added checks are UI gates only.
- `ComingSoon.tsx` waitlist disclosure (stays).

## Technical notes

- No migration, no edge-function change, no new deps.
- All new copy goes through `t()`.
- Tailwind classes already exist for the row layout — reuse `flex items-start gap-3 p-3 rounded-2xl border border-border`.
