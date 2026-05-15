# Replace logo assets with new Apnea Mate brand files

## Current state

The project doesn't currently use any real logo image files. The "logo" slots are placeholders:
- **Auth screens** (`src/pages/Auth.tsx`, `src/pages/ResetPassword.tsx`): a `Waves` lucide icon inside a `#345678` rounded square — 3 occurrences.
- **Community header** (`src/components/community/CommunityHeader.tsx`): text-only "APNEA MATE" wordmark.
- **Favicon**: `public/favicon.png` + `public/favicon.ico`.
- **OG image**: `public/og-image.png`.
- No splash screen / coming-soon / landing page exists in the codebase.

So this task is mostly: import the new assets, build a centralized `Logo` component, and swap the placeholders.

## Steps

### 1. Copy assets into the project
Copy all 11 uploaded files into `src/assets/logos/` (so Vite bundles + hashes them). Note: the user's filename `apnea_mate_pittogramm__black.png` doesn't match the actually uploaded `apnea_mate_pittogramma_black.png` — I'll use the real uploaded filename. Two files mentioned in the rules (`apnea_mate_logo_app_mono_white.png`, `apnea_mate_logo_app_mono_black.png`) were not in the uploads — I'll flag this and skip them unless you re-upload.

Available uploads to copy:
- apnea_mate_logo_orizzontale.png / _white / _mono_black / _mono_white
- apnea_mate_logo_app.png / _white
- apnea_mate_pittogramma.png / _white / _black

### 2. Create a centralized `Logo` component
`src/components/brand/Logo.tsx` exports a single component with a `variant` prop:
```
variant: "horizontal" | "horizontal-white" | "horizontal-mono-black" | "horizontal-mono-white"
       | "app" | "app-white"
       | "symbol" | "symbol-white" | "symbol-black"
```
Imports each PNG via ES6 so paths live in one file. Renders a plain `<img>` with `alt="Apnea Mate"` and proper width/height to preserve aspect ratio.

### 3. Replace placeholder usages
- **`src/pages/Auth.tsx`** (2 spots) and **`src/pages/ResetPassword.tsx`** (1 spot): replace the `#345678` square + `Waves` icon with `<Logo variant="app" />` (auth screens are on light `bg-background`, but the `app` variant has the gradient symbol that reads on light too; if you prefer mono use `app-mono-black` once you upload it). Remove the now-unused `Waves` import in those files.
- **`src/components/community/CommunityHeader.tsx`**: leave the text wordmark as-is (it's not a logo image, and the request says don't recolor or distort). I'll only touch this if you confirm you want the image logo here.

### 4. Favicon
Replace `public/favicon.png` with the pittogramma (color). Delete `public/favicon.ico` so the browser falls back to the new PNG. `index.html` already references `/favicon.png` so no markup change needed.

### 5. Cleanup
- No old logo image files exist to delete (only favicon, replaced above).
- Remove unused `Waves` imports left over after swap.

## Open questions
1. The two `_mono_white` / `_mono_black` **app** variants weren't uploaded — re-upload, or skip?
2. Filename `apnea_mate_pittogramm__black.png` in your list vs actual `apnea_mate_pittogramma_black.png` — using the actual uploaded name. OK?
3. Community header currently uses styled text "APNEA MATE / Community" — keep as text, or replace with the horizontal logo image?
