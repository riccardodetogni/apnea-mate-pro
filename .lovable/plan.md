# Brand Icon Replacement Plan

## 1. Upload assets
Copy the 8 uploaded PNGs into `public/assets/icons/`:
- `buddy.png`, `buddy_bianco.png`
- `gruppi.png`, `gruppi_bianco.png`
- `scuole.png`, `scuole_bianco.png`
- `spot.png`, `spot_bianco.png`

## 2. Central icon component
Create `src/components/brand/BrandIcon.tsx`:
- Exports a typed registry `{ buddy, gruppi, scuole, spot }` each with `color` and `white` variants.
- Component API: `<BrandIcon name="spot" variant="color" size={24} />` — renders an `<img>` from `/assets/icons/...`, with `alt`, `width`, `height` (aspect-ratio preserved). No CSS filters/recoloring allowed.

## 3. Replacements — frontend

**Bottom navigation** (`src/components/layout/BottomNav.tsx`)
- Replace lucide icons:
  - `MapPin` → `BrandIcon name="spot"`
  - `Users` → `BrandIcon name="gruppi"`
- Size 24×24. The bottom nav has a dark/blurred background → use **color** variant (matches "match bar background" rule, our nav is dark).
- Keep `Globe` (Community), `MessageCircle` (Messages), `BarChart3` (Training) untouched — not in scope.

**Coming Soon landing** (`src/pages/ComingSoon.tsx`)
- Feature teaser items: replace 🤿 with `buddy` (color), 👥 with `gruppi` (color). Size 40×40.
- Remove the emoji strings; render `<BrandIcon>` instead.

**Community page** (`src/pages/Community.tsx`)
- Line 381: `👥 {g.name}` → `<BrandIcon name="gruppi" variant="color" size={16} />` inline.
- Line 386: `📍 {s.name}` → `<BrandIcon name="spot" variant="color" size={16} />` inline.

**Spot cards / bubble** (`src/components/spots/SpotCard.tsx`, `SpotBubble.tsx`)
- Replace the `environmentType` emoji map fallback `📍` and the `deep_pool: "🤿"` entry. Per rules, both "spot" emoji (📍) and the diver/buddy emoji (🤿) used as the deep-pool marker should switch to the brand `spot` icon (variant matches the card surface — navy card → color variant). Size 32×32 on `SpotCard`, 24×24 in `SpotBubble`'s thumbnail tile.
- The sea/lake/pool emojis (🌊 🏞️ 🏊) are kept — they're environment-type indicators, not in the four-concept scope.

**Spot details** (`src/pages/SpotDetails.tsx` line 208)
- Same: replace the `📍` fallback with `<BrandIcon name="spot" />`.

## 4. Replacements — transactional emails
Update these templates to swap the four concept emojis for `<img>` tags pointing to the public icons hosted under the production domain (`https://apneamate.com/assets/icons/...`), since email clients can't import React assets:
- `waitlist-confirmation.tsx` — 🤿 → buddy, 👥 → gruppi (color variants; emails render on white → use **bianco**? No — bianco on white is invisible. Use **color** variants on white email backgrounds.)
- `group-request-received.tsx`, `group-request-approved.tsx`, `group-request-rejected.tsx` — 📍 → spot.
- `session-request-approved.tsx`, `session-request-rejected.tsx`, `session-join-request.tsx` — 📍 → spot, 🤿 in headings → buddy.

Icons sized ~20px inline, `vertical-align: middle`.

## 5. Cleanup sweep
After edits, re-run `rg "🤿|👥|🫂|🎓|📍|🗺️|📚"` over `src/` and `supabase/functions/` and remove any leftover occurrences tied to the four concepts.

## 6. Out of scope (not touched)
- Lucide `MapPin` used for **generic addresses** (e.g. `LocationAutocomplete`, `SearchBar`, `EventCard` address line, profile location, group hero address). These are not "dive spot" contexts — they're physical addresses. I'll leave them as lucide `MapPin` to avoid visually overloading the brand spot mark on every address line.
- Lucide `Users` used for **member counts / avatars / participants UI** (e.g. group member counts, participant lists). The brand `gruppi` mark is reserved for "group" entity branding, not count UI affordances. Same reasoning for `GraduationCap`/`UserPlus`.

If you want those generic location/people icons also swapped to brand marks, say the word and I'll extend the sweep.

## Technical notes
- Files in `public/` are served from the site root, so `<img src="/assets/icons/spot.png" />` works in the app. For emails, use the absolute `https://apneamate.com/...` URL.
- No CSS filters or opacity tricks — variant choice handled by the `variant` prop.
- The `BrandIcon` component is the single swap point for future icon updates.
