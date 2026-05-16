# Coming Soon: IG link + EN/IT localization

## 1. Instagram link
`src/pages/ComingSoon.tsx` footer: replace `https://www.instagram.com/` with `https://www.instagram.com/apneamate/` and drop the TODO comment.

## 2. EN/IT localization
Use the project's existing i18n system (`src/lib/i18n.ts` + `LanguageContext`).

### 2a. Add translation keys
In both `it` and `en` blocks of `src/lib/i18n.ts`:
- `comingSoonHeadline`, `comingSoonSubtitle`
- `comingSoonDays`, `comingSoonHours`, `comingSoonMinutes`, `comingSoonSeconds`
- `comingSoonEmailPlaceholder`, `comingSoonEmailMicrocopy`, `comingSoonSubmit`
- `comingSoonErrInvalid`, `comingSoonErrAlready`, `comingSoonErrGeneric`, `comingSoonSuccess`
- `comingSoonFeatureSpotTitle/Desc`, `comingSoonFeatureBuddyTitle/Desc`, `comingSoonFeatureGruppiTitle/Desc`, `comingSoonFeatureScuoleTitle/Desc`
- `comingSoonCopyright` (year interpolated in component)

EN copy:
- Headline: "Freediving isn't a solo sport."
- Subtitle: "The app to find buddies, groups, spots and schools is coming. Sign up to be among the first in."
- Submit: "Join the first wave"
- Microcopy: "No spam. Just one email when the app is ready."
- Cards: "Find your spot / Find your buddy / Find your group / Find your school" with translated descriptions.

### 2b. Wire up the page
In `ComingSoon.tsx`:
- `import { useLanguage }` so the component re-subscribes on language change, then call `t(...)` for every string.
- Move `features` array inside the component.
- Set `document.documentElement.lang = language` via `useEffect` so the `<html lang>` matches.

### 2c. Top-right EN/IT pill toggle
Add an absolutely positioned pill at the top-right of the hero, styled with the same `bg-white/8 + backdrop-blur` as the countdown blocks. Two compact buttons: `IT` | `EN`, the active one highlighted. Calls `setLanguage("it" | "en")` from `useLanguage()`. Respects safe-area.

### 2d. Default language detection
Tweak `getLanguage()` in `src/lib/i18n.ts`: keep existing saved-preference logic, but when nothing is saved, default to `navigator.language?.toLowerCase().startsWith("it") ? "it" : "en"` (instead of always `"it"`). Saved choices unaffected.

## 3. Waitlist confirmation email (EN/IT)
- Duplicate `supabase/functions/_shared/transactional-email-templates/waitlist-confirmation.tsx` into `waitlist-confirmation-en.tsx` with English copy and subject `"You're on the list — Apnea Mate"`. Keep the existing file as the Italian version, optionally renaming it to `waitlist-confirmation-it.tsx` and registering both in `registry.ts`.
- Update `registry.ts` to export both `waitlist-confirmation-it` and `waitlist-confirmation-en`. Keep `waitlist-confirmation` as an alias for `-it` to stay backward-compatible.
- In `ComingSoon.tsx`, send `templateName: \`waitlist-confirmation-${language}\`` in the `supabase.functions.invoke` call.
- Deploy `send-transactional-email` so the new template registry is live.

## 4. Out of scope
- Localizing `<title>` and meta tags in `index.html` (would require Helmet; not requested).
- Localizing other pages — already covered by the shared `t()` infrastructure.
