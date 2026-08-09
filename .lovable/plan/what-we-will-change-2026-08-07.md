Remove Static Apnea and Dynamic Apnea from the new logbook record creation form.

## What we will change

- In `src/pages/CreateDiveLog.tsx`, remove the two discipline values (`discStatica` and `discDinamica`) from the `DISCIPLINES` array that populates the dropdown on the "New logbook record" page.

## What we will NOT change

- We will not delete the i18n keys `discStatica` and `discDinamica`; they are still needed to display existing logbook records that already use those disciplines.
- We will not touch the database schema, `dive_logs` enum, or any other creation/edit flow (e.g., register-generated logs). The change is scoped to the manual creation form only.

## Verification

- Open `/logbook/new` and confirm the dropdown contains only: Constant weight, Variable weight, Free immersion, Exploration, Other.
- Confirm existing records with Static apnea / Dynamic apnea still display correctly in the logbook list and detail views.
