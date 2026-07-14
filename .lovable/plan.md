## Changes

### 1. Landing — "Scopri Apnea Mate" scrolls instead of navigating
In `src/pages/Landing.tsx`:
- Add `id="pain-banner"` to the wrapping section of the "Quante volte vorresti fare apnea…" bubble (around line ~315).
- Add a `scrollToPain` helper that calls `document.getElementById("pain-banner")?.scrollIntoView({ behavior: "smooth", block: "start" })`.
- Change the primary CTA button (`landingCtaPrimary` — "Scopri Apnea Mate" / "Discover Apnea Mate") `onClick` from `goRegister` to `scrollToPain`.
- Leave the "Hai già un account? Accedi" secondary link and header Login button untouched — registration remains reachable via the pain-section flow further down (existing CTAs).

### 2. Fix "DATI PERSONALI" block on white Auth page
The `registerPersonalInfoTitle` / `registerPersonalInfoDesc` info card on `src/pages/Auth.tsx` currently uses a dark/muted background (designed for the dark hero) that looks muddy on the white page.
- Locate the block in `src/pages/Auth.tsx` and restyle it using light-surface semantic tokens: soft `--primary / 0.06` background, `--primary / 0.20` border, title in `--primary`, body in `--muted-foreground` / `--foreground`. No hardcoded colors.

### 3. Fix IT/EN language toggle on white pages
`LanguageToggle` in `src/pages/Landing.tsx` is hardcoded with white-on-transparent styles (`bg-white/15`, `text-white/60`) — fine on the dark hero, but the same component (or same visual) also appears on the white Auth page where it becomes unreadable.
- Refactor `LanguageToggle` to accept a `variant?: "dark" | "light"` prop (default `"dark"` for the hero).
- Light variant: subtle `--muted` background, `--border` border, active pill uses `--primary / 0.12` bg with `--primary` text; inactive uses `--muted-foreground`.
- Update the Auth page usage (and any other light-background usage) to pass `variant="light"`. Hero header keeps default.

## Out of scope
- No copy/i18n changes, no routing changes, no backend, no new deps.
- No changes to hero layout, features, audience, how-it-works, footer.
