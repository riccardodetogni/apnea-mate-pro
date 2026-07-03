## Problem

Sharing the app link shows the old wave logo. That's because `public/og-image.png` is still the old design (dark navy background + old circular wave icon + "Connect. Dive. Explore." tagline). The current brand uses the "three freedivers" gradient logo in `src/assets/logos/`. `index.html` correctly points `og:image` and `twitter:image` to `/og-image.png` — the file itself just needs to be regenerated.

## Also worth fixing (small)

- `og:url` in `index.html` is `https://apnea-mate.lovable.app`, but the head-metadata guide says canonical/og:url should point at the project domain `https://apneamate.com`. Same for the OG image URL host.
- `public/favicon.png` — check whether it's already the new pictogram or still the old wave; update if stale so browser tabs match the brand.

## Plan

1. **Generate a new `public/og-image.png`** (1200×630, standard OG size) using the new brand:
   - New "three freedivers" gradient pictogram from `src/assets/logos/apnea_mate_pittogramma_white.png` on the left.
   - "Apnea Mate" wordmark + tagline "Connect. Dive. Explore." in white on the right.
   - Deep navy → blue gradient background matching the app theme.
   - Use `imagegen` at premium quality (text legibility matters for social previews).
2. **Update `public/favicon.png`** to the new pictogram if it's still the old icon — replace with a square export of `apnea_mate_pittogramma.png` (or a rounded-square variant so it reads well at 32×32).
3. **Fix `index.html` head**:
   - Change `og:url` to `https://apneamate.com`.
   - Change `og:image` and `twitter:image` to `https://apneamate.com/og-image.png`.
   - Add a `<link rel="canonical" href="https://apneamate.com/">` (currently missing).
4. **Publish** so the new image is served on `apneamate.com`. Tell the user: social platforms (WhatsApp, LinkedIn, Facebook, iMessage, X) cache preview images aggressively — they may need to force a refresh via each platform's link-preview debugger (Facebook Sharing Debugger, LinkedIn Post Inspector, X Card Validator) to see the new logo immediately.

## Confirm before I proceed

- OK to regenerate `og-image.png` with the new "three freedivers" gradient pictogram + wordmark + tagline on the navy-blue gradient background?
- Do you also want the favicon updated (if it's still the old wave), or leave that alone for this pass?
