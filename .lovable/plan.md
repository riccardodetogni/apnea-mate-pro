## Problem

The share thumbnail at `public/og-image.png` uses a stylized illustration of three human figures with long tails — not the real Apnea Mate brand mark (three curved wave strokes with separate dot heads above them, next to lowercase "apnea mate"). So when the app is shared on WhatsApp / iMessage / Slack / LinkedIn / X, the preview shows off-brand artwork.

## Fix

1. Replace `public/og-image.png` with a new 1200×630 OG image built from the real brand assets in `src/assets/logos/`:
   - Use `apnea_mate_pittogramma_white.png` (the actual 3-wave pictogram) + wordmark from `apnea_mate_logo_orizzontale_white.png`, composited onto the existing deep-blue gradient background with the wave motif.
   - Keep the tagline "Connect. Dive. Explore."
   - Keep filename `og-image.png` so all existing `<meta og:image>` / `twitter:image` URLs keep working.
2. No changes to `index.html` meta tags are required (URL stays the same).
3. Tell the user that WhatsApp / LinkedIn / Slack cache OG previews — the new thumbnail won't show up in already-shared links until each platform re-scrapes, and they can force a refresh via each platform's link-preview debugger (e.g. LinkedIn Post Inspector, Facebook Sharing Debugger).

## Out of scope

- No per-route OG images (would need `react-helmet-async` + separate design).
- No changes to favicon or in-app logos — those already use the correct brand files.
