## Goal
Intercept the "+ Crea" button on the Community screen with a mandatory safety disclaimer modal that appears every time, before navigating to `/create`.

## Implementation

### 1. New component: `src/components/community/CreateDisclaimerModal.tsx`
- Built with shadcn `Sheet` (side="bottom") for a bottom-sheet feel on mobile, with rounded top corners.
- Header: `ShieldAlert` (lucide-react) icon in an amber/warning circle, title `t("createDisclaimerTitle")` ("Prima di continuare" / "Before continuing").
- Scrollable body (`max-h-[55vh] overflow-y-auto`) containing:
  - One `Checkbox` + label using `text-xs leading-relaxed` for the long Italian/English disclaimer text.
- Footer with two stacked buttons:
  - `Continua` / `Continue` — `variant="primaryGradient"`, `disabled={!accepted}`, on click: `onConfirm()`.
  - `Annulla` / `Cancel` — `variant="ghost"`, on click: `onClose()`.
- Local `useState` for `accepted`, **reset to `false` every time `open` becomes true** (via `useEffect`) so the disclaimer must be re-accepted on every tap.

### 2. Wire it into `src/components/community/CommunityHeader.tsx`
- Add local `useState` `disclaimerOpen`.
- Replace the existing `onClick={() => navigate("/create")}` on the "+ Crea" button with `onClick={() => setDisclaimerOpen(true)}`.
- Render `<CreateDisclaimerModal open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} onConfirm={() => { setDisclaimerOpen(false); navigate("/create"); }} />`.

### 3. i18n keys in `src/lib/i18n.ts` (IT + EN)
- `createDisclaimerTitle` — "Prima di continuare" / "Before continuing"
- `createDisclaimerCheckbox` — full Italian legal text provided by the user / faithful English translation
- `createDisclaimerContinue` — "Continua" / "Continue"
- `createDisclaimerCancel` — "Annulla" / "Cancel"

## Out of scope
- No changes to the `/create` page itself.
- No database / persistence — the disclaimer is shown every time as requested, no acceptance is stored.
- No changes to other entry points to `/create` (e.g. floating buttons elsewhere) — only the Community header "+ Crea" button as specified.
