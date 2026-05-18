# Themed Error Pages

Bring the 404 and a new runtime error page in line with the Deep Blue Gradient theme used across the app (navy `card` surfaces, teal→blue gradient accents, glassmorphic chips, Lucide icons).

## 1. Redesign `src/pages/NotFound.tsx`

Replace the bare `bg-muted` layout with an on-brand screen wrapped in `AppLayout` (nav hidden):

- Centered themed card using `.card-session` styling (navy with teal/blue radial overlays already defined in `index.css`).
- Big gradient "404" using `btn-primary-gradient` text treatment (background-clip: text via inline style or a utility class).
- Lucide `Compass` icon in a circular `avatar-gradient` badge above the title — fits the diving / navigation metaphor.
- Title: "Page not found" / IT: "Pagina non trovata" (use `useLanguage` from `LanguageContext` for the existing i18n pattern).
- Subtitle explaining the route doesn't exist, muted white text.
- Two actions:
  - Primary `Button variant="primaryGradient"` → `Home` icon + "Back to Community" → navigates to `/community`.
  - Secondary `Button variant="pillOutline"` → `ArrowLeft` icon + "Go back" → `navigate(-1)`.
- Keep the existing `console.error` 404 log for debugging.
- Use `react-router-dom`'s `Link` / `useNavigate` rather than raw `<a>` so client routing is preserved.

## 2. New `src/components/ErrorBoundary.tsx` + wire it in `App.tsx`

Add a class-based React error boundary so runtime crashes show a themed screen instead of a white page.

- Catches render errors, logs to console, stores `error` in state.
- Fallback UI mirrors the 404 design but with:
  - `AlertTriangle` icon in the gradient badge.
  - Title "Something went wrong" (IT: "Qualcosa è andato storto").
  - Short muted explanation.
  - Buttons: primary `RotateCcw` "Try again" (resets state + `window.location.reload()`), secondary "Back to Community" linking to `/community`.
- In `App.tsx`, wrap `<Suspense>` (or the `<Routes>`) in `<ErrorBoundary>` so all lazy-loaded pages are covered. Place it inside `BrowserRouter` so the fallback can use router hooks if needed.

## 3. i18n

Add the new strings ("Page not found", "Go back", "Back to Community", "Something went wrong", "Try again", and the subtitles) to `src/lib/i18n.ts` under both `en` and `it` so the pages match the rest of the app.

## Technical notes

- No new dependencies — all icons (`Compass`, `Home`, `ArrowLeft`, `AlertTriangle`, `RotateCcw`) come from `lucide-react`, already used across the app.
- Only semantic tokens / existing utility classes (`card-session`, `avatar-gradient`, `btn-primary-gradient`, `chip-filter`) are used — no hardcoded colors.
- No backend, schema, or auth changes.
- No changes to existing routes; the 404 stays as the `*` catch-all.
