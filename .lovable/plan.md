
# Reintroduce Teal-to-Blue Gradient Theme from HTML Reference

## Overview

Bring back the gradient visual style visible in the screenshots and defined in the HTML reference file. The key colors are **teal** (`#3fbdc8`) and **blue** (`#3f66e8`), applied as gradients on buttons, card overlays, avatars, and the nav active indicator. The card base color changes from `#012345` to `#233a6b` (a richer navy).

**Critical fix**: The HTML reference uses `::before` and `::after` pseudo-elements for subtle radial gradient overlays on cards. The previous implementation caused a visible "rectangle" interruption. The fix is to ensure these pseudo-elements use `position: absolute` with `pointer-events: none`, `border-radius: inherit` on the card, `overflow: hidden`, and all card content uses `position: relative; z-index: 1` so text sits above the overlay.

## Color Changes

| Element | Current | New |
|---|---|---|
| Card background (`--card`) | `#012345` (210 97% 14%) | `#233a6b` (221 51% 28%) |
| Primary / buttons | `#456789` solid | `linear-gradient(135deg, #3fbdc8, #3f66e8)` |
| Accent colors | `#345678` | `--accent: #3fbdc8`, `--accent-2: #3f66e8` |
| Avatar backgrounds | `#234567` solid | `linear-gradient(135deg, #3fbdc8, #3f66e8)` |
| Nav active indicator | `#456789` solid | `linear-gradient(135deg, #3fbdc8, #3f66e8)` |
| Body background | Plain `#F7F9FC` | Subtle radial gradients (teal/blue wash at top) |
| Shadow elevated | Dark navy shadow | `rgba(63,102,232,0.22)` blue-tinted shadow |

## Detailed Changes

### 1. `src/index.css` - CSS Variables and Component Styles

**Variables**:
- `--card`: change to `221 51% 28%` (#233a6b)
- `--primary`: change to `228 80% 58%` (#3f66e8) -- used for solid fallbacks
- `--primary-deep`: repurpose to `185 57% 52%` (#3fbdc8 -- teal)
- `--primary-light`: repurpose to `228 80% 58%` (#3f66e8 -- blue)
- `--accent`: change to `185 57% 52%` (#3fbdc8)
- `--ring`: update to match new primary
- `--shadow-elevated`: change to `0 10px 22px rgba(63,102,232,0.22)`
- Add `--card-border: 0 0% 100% / 0.16` (slightly more visible)

**Body background**: Add subtle radial gradient wash:
```css
body {
  background:
    radial-gradient(1200px 500px at 50% -10%, rgba(63,189,200,0.22), transparent 60%),
    radial-gradient(900px 500px at 90% 15%, rgba(63,102,232,0.18), transparent 55%),
    hsl(var(--background));
}
```

**`.btn-primary-gradient`**: Replace solid with gradient:
```css
background: linear-gradient(135deg, #3fbdc8, #3f66e8);
box-shadow: 0 10px 22px rgba(63,102,232,0.22);
border: 1px solid rgba(255,255,255,0.55);
```

**`.card-session` and `.card-group`**: Add `position: relative; overflow: hidden;` and add `::before` / `::after` pseudo-elements with radial gradient overlays. The key to preventing the "rectangle" bug is:
- Cards get `overflow: hidden` and `position: relative`
- Pseudo-elements are absolutely positioned with large negative insets so they extend beyond the card edges
- They use `border-radius: 0` (the parent clips them via `overflow: hidden`)
- All card child content must have `position: relative; z-index: 1` (this is handled by the card's internal structure already since we use flex layout -- but we add a z-index utility for safety)

```css
.card-session, .card-group {
  position: relative;
  overflow: hidden;
}
.card-session::before, .card-group::before {
  content: "";
  position: absolute;
  top: -40%; right: -40%;
  width: 220px; height: 220px;
  background: radial-gradient(circle at 30% 30%, rgba(63,189,200,0.28), transparent 62%);
  transform: rotate(18deg);
  pointer-events: none;
}
.card-session::after, .card-group::after {
  content: "";
  position: absolute;
  bottom: -60%; right: -30%;
  width: 240px; height: 240px;
  background: radial-gradient(circle at 40% 40%, rgba(63,102,232,0.22), transparent 62%);
  transform: rotate(-12deg);
  pointer-events: none;
}
```

**`.avatar-user`**: Change from `#234567` to gradient:
```css
background: linear-gradient(135deg, #3fbdc8, #3f66e8);
```

**`.nav-item.active::after`**: Change from `#456789` to gradient:
```css
background: linear-gradient(135deg, #3fbdc8, #3f66e8);
```

### 2. `tailwind.config.ts`

- Add `accent-2` color mapped to `--accent-2` (or direct hex `#3f66e8`)
- Update primary color to new HSL value
- Update accent color to new HSL value

### 3. `src/components/ui/button.tsx`

- `pill` variant: Use the CSS class `btn-primary-gradient` for the gradient background instead of `bg-primary`
- `primaryGradient` variant: Use `btn-primary-gradient` class
- Both get the gradient border and shadow from the CSS class

### 4. `src/components/community/SessionCard.tsx`

- Add `relative z-[1]` to all direct children of the card to ensure they sit above the pseudo-element gradient overlays

### 5. `src/components/community/GroupCard.tsx`

- Same z-index fix for children sitting above the gradient overlay

### 6. Avatar Gradient Updates (multiple files)

Replace all `bg-[#234567]` with a gradient class. Create a utility class `.avatar-gradient` in index.css:
```css
.avatar-gradient {
  background: linear-gradient(135deg, #3fbdc8, #3f66e8);
  box-shadow: 0 10px 22px rgba(63,102,232,0.22);
  border: 1px solid rgba(255,255,255,0.55);
}
```

Files to update:
- `src/components/community/CommunityHeader.tsx` (line 27)
- `src/components/ui/AvatarUpload.tsx` (line 137)
- `src/components/groups/GroupHeroCard.tsx` (line 32)
- `src/pages/SessionDetails.tsx` (line 401)
- `src/pages/UserProfile.tsx` (line 119)
- `src/pages/Search.tsx` (line 416)

### 7. Body Background in `src/components/layout/AppLayout.tsx`

No change needed -- the body background is set in CSS.

## Preventing the "Rectangle" Bug

The previous gradient implementation likely caused a visible rectangle because:
1. The pseudo-elements (`::before`/`::after`) did not have `pointer-events: none`
2. The card lacked `overflow: hidden`, so the gradient circle extended visibly beyond rounded corners
3. Card content did not have `z-index` to sit above the overlays

The fix ensures:
- **`overflow: hidden`** on the card clips the pseudo-element gradients to the card's rounded shape
- **`pointer-events: none`** on pseudo-elements prevents them from interfering with clicks
- **`position: relative; z-index: 1`** on card content keeps text readable above the overlay
- The gradients use `radial-gradient(circle, ...)` with `transparent` falloff, so they fade smoothly into the card base color with no hard edges

## Files to Modify

| File | Changes |
|---|---|
| `src/index.css` | New gradient variables, body background wash, card pseudo-element overlays, avatar gradient class, button gradient, nav gradient |
| `tailwind.config.ts` | Add accent-2 color, update primary/accent HSL values |
| `src/components/ui/button.tsx` | pill and primaryGradient use gradient CSS class |
| `src/components/community/SessionCard.tsx` | Add z-index to card children |
| `src/components/community/GroupCard.tsx` | Add z-index to card children |
| `src/components/community/CommunityHeader.tsx` | Avatar gradient |
| `src/components/ui/AvatarUpload.tsx` | Avatar gradient |
| `src/components/groups/GroupHeroCard.tsx` | Avatar gradient |
| `src/pages/SessionDetails.tsx` | Avatar gradient |
| `src/pages/UserProfile.tsx` | Avatar gradient |
| `src/pages/Search.tsx` | Avatar gradient |

## Scope

This is purely a visual/styling change. No logic, database, routing, or functional changes are needed.
