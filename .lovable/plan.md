## Add app screenshots to the landing page (one per section)

Use the 3 uploaded screenshots as real product visuals, one per section, in `src/pages/Landing.tsx`.

### Assignment

- **Features ("Cosa trovi dentro")** → Community screenshot (`Screenshot_2026-07-14_at_11.50.20.png`)
- **Audience ("Per chi è Apnea Mate")** → Groups screenshot (`Screenshot_2026-07-14_at_11.51.44.png`)
- **How it works** → Spots map screenshot (`Screenshot_2026-07-14_at_11.51.24.png`)

### Approach

1. **Upload the 3 screenshots as CDN assets** via `lovable-assets`, store pointer JSONs in `src/assets/landing/` (`community.png.asset.json`, `groups.png.asset.json`, `spots.png.asset.json`). No binaries in repo.

2. **New `PhoneMockup` component** (local to `Landing.tsx`):
   - Rounded 2xl frame, subtle border using `--landing-light-border`, soft shadow, slight scale/tilt on `md+`.
   - `object-cover` with `object-top` so the image is **cropped** rather than shrunk when the container is shorter than the screenshot — this satisfies "cut them if needed for sizing".
   - Soft radial glow behind it using `--primary` / `--accent` tokens.
   - `pointer-events-none`, `select-none`, `draggable={false}`, `loading="lazy"`, descriptive `alt`.

3. **Responsive split layout** for the three sections:
   - `md+`: 2-column grid (`md:grid-cols-2`, `gap-10`). Text left / image right for Features and How-it-works; **mirrored** (image left / text right) for Audience to create rhythm.
   - Mobile: single column, mockup rendered **above** the text block at a reduced height (e.g. `max-h-[420px]` with `object-top` crop) so it doesn't dominate the fold.
   - Vertical alignment centered; container capped at `max-w-5xl` (was `max-w-3xl`) on these sections only to fit the new column.

4. **Untouched**: hero, language toggle, banner card, final CTA, all i18n keys, all copy, routing, hooks, backend logic, and the existing `BackgroundSymbols` watermark.

5. **Styling constraints**: semantic tokens only (no hardcoded colors), no new dependencies, no design-system changes.

### Files touched

- `src/pages/Landing.tsx` — add `PhoneMockup`, restructure the 3 sections into responsive 2-col grids, widen their containers to `max-w-5xl`.
- `src/assets/landing/community.png.asset.json` (new)
- `src/assets/landing/groups.png.asset.json` (new)
- `src/assets/landing/spots.png.asset.json` (new)

### Out of scope

- No changes to hero, banner, final CTA, or copy.
- No new translations or i18n keys.
- No animations beyond existing CSS transitions.
