## Goal
Intercept taps on the "Training" tab in the bottom nav with a mandatory safety disclaimer modal that appears every time, before navigating to `/training`.

## Implementation

### 1. Generalize the existing modal: rename `CreateDisclaimerModal` → `DisclaimerModal`
`src/components/community/CreateDisclaimerModal.tsx` already implements the exact bottom-sheet style required. To stay DRY and visually identical, refactor it into a reusable component.

- Move to `src/components/common/DisclaimerModal.tsx`.
- Accept extra props: `title: string`, `checkboxText: string`, `confirmLabel: string`, `cancelLabel: string` (with sensible defaults falling back to the existing `createDisclaimer*` i18n keys for backward compatibility).
- Keep the same layout: `ShieldAlert` icon, scrollable body, single mandatory checkbox, primary "Continua" + ghost "Annulla", `accepted` resets to `false` every time `open` flips to true.
- Update `CommunityHeader.tsx` to import the new path and pass the existing create-flow keys explicitly.

### 2. New i18n keys (IT + EN) in `src/lib/i18n.ts`
- `trainingDisclaimerCheckbox` — full Italian text provided by the user / faithful English translation. (Title and button labels reuse `createDisclaimerTitle` / `createDisclaimerContinue` / `createDisclaimerCancel` since the spec says "same layout, same style".)

### 3. Wire it into `src/components/layout/BottomNav.tsx`
- Add `useState` for `trainingDisclaimerOpen`.
- In the `onClick` handler, if `path === "/training"` and `location.pathname !== "/training"`, call `e.preventDefault()`-equivalent (just don't navigate) and `setTrainingDisclaimerOpen(true)` instead of `navigate(path)`. If already on `/training`, do nothing special.
- Render `<DisclaimerModal open={trainingDisclaimerOpen} onClose={...} onConfirm={() => { setTrainingDisclaimerOpen(false); navigate("/training"); }} title={t("createDisclaimerTitle")} checkboxText={t("trainingDisclaimerCheckbox")} confirmLabel={t("createDisclaimerContinue")} cancelLabel={t("createDisclaimerCancel")} />`.

## Out of scope
- No changes to the `/training` page itself or its child routes.
- No persistence — disclaimer shows on every tap as requested.
- Other entry points to Training (deep links, back navigation) are not intercepted, only the bottom-nav tab tap, matching the spec.
