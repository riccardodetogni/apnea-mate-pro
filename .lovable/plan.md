

# Apply Deep Blue Sea Palette and Remove All Gradients

## Overview

Replace the current teal-to-blue gradient theme with a clean, uniform monochromatic deep blue palette from the "Deep Blue Sea" color palette. Remove all gradients from buttons, avatars, card overlays, and navigation. Ensure white text throughout and fix all remaining black text issues.

## Color Palette

From the reference palette (color-hex.com/color-palette/4444):

| Hex | HSL | Usage |
|---|---|---|
| `#012345` | 210 97% 14% | Cards, bubbles (darkest) |
| `#123456` | 210 65% 20% | Secondary surfaces, hover states on cards |
| `#234567` | 210 49% 27% | Accents, borders on dark surfaces |
| `#345678` | 210 40% 34% | Secondary buttons, badges |
| `#456789` | 210 33% 40% | Primary buttons, active states (lightest) |

All text on dark surfaces will be white or white with alpha.

## What Changes

### 1. CSS Variables (`src/index.css`)

- `--card` changes from `221 51% 28%` to `210 97% 14%` (#012345)
- `--primary` changes from `228 80% 58%` to `210 33% 40%` (#456789)
- Remove `--primary-deep` and `--primary-light` (no longer needed for gradients), or repurpose them as solid colors from the palette
- `--accent` changes to `210 40% 34%` (#345678)
- `--ring` updated to match new primary
- `--shadow-elevated` changes to a simpler shadow using palette colors instead of gradient blue

### 2. Remove All Gradients (`src/index.css`)

**`.btn-primary-gradient`**: Replace `linear-gradient(...)` with solid `#456789`

**`.card-session::before` / `::after`**: Remove the radial gradient pseudo-elements entirely (or make them transparent)

**`.card-group::before` / `::after`**: Same -- remove radial gradient pseudo-elements

**`.avatar-user`**: Replace gradient background with solid `#234567`

**`.nav-item.active::after`**: Replace gradient with solid `#456789`

**`body` background**: Remove the two radial gradients, use plain `bg-background` or a very subtle single-color wash

### 3. Button Variants (`src/components/ui/button.tsx`)

- `pill` variant: Remove `btn-primary-gradient`, use solid bg `bg-primary text-white`
- `pillOutline` variant: Keep as is (translucent outline on dark)
- `primaryGradient` variant: Remove gradient, use solid `bg-primary text-white`
- `social` variant: Keep as is

### 4. Component Gradient Removals

**`CommunityHeader.tsx`** (line 27): AvatarFallback uses `bg-gradient-to-br from-accent to-primary` -- change to solid `bg-[#234567]`

**`SessionDetails.tsx`** (line 400): Creator avatar uses `bg-gradient-to-br from-primary-deep to-primary-light` -- change to solid `bg-[#234567]`

**`UserProfile.tsx`** (line 119): Profile avatar uses `bg-gradient-to-br from-primary-deep to-primary-light` -- change to solid `bg-[#234567]`

**`GroupHeroCard.tsx`** (line 28): Container uses `bg-gradient-to-br from-primary/20 via-primary/10 to-background` -- change to solid `bg-card`; Avatar (line 38) uses `bg-gradient-to-br from-primary to-primary/70` -- change to solid `bg-[#234567]`; Background pattern blurs -- remove

**`SpotCard.tsx`** (line 89): Placeholder image uses `bg-gradient-to-br from-primary/20 to-primary/5` -- change to solid `bg-[#012345]`

### 5. Fix Remaining Black Text Issues

**`GroupHeroCard.tsx`**:
- Line 48: `text-foreground` on name -- change to `text-card-foreground`
- Line 50: `text-muted` on location -- change to `text-white/55`
- Line 55: `text-muted` on members -- change to `text-white/55`
- Line 86: `text-muted-foreground` on community badge -- change to `text-white/55`

**`GroupDetails.tsx`**:
- Line 180: `text-foreground` on description heading -- change to `text-foreground` (this is on light bg, correct)
- Line 181: `text-muted` on description body -- this uses the light background so `text-muted` is the dark alpha which is actually correct here
- Line 189: `text-muted-foreground` on tags -- change to appropriate visible color
- Line 201: `text-foreground` on courses heading -- correct (light bg)

**`GroupSessionsList.tsx`**:
- Line 55: `text-primary` on month -- this should stay or change to `text-white/70`
- Line 58: `text-primary` on day -- change to `text-white/90`
- Line 64: `text-card-foreground` -- correct
- Line 66-72: `text-white/55` -- correct

**`SpotCard.tsx`** (used on light background):
- Line 100: `text-foreground` on name -- correct (light bg)
- Line 105: `text-muted` on location -- correct (light bg)

**`CertificationStatus.tsx`**:
- Line 57: `text-muted` on description -- this component sits on a light bg, but `text-muted` resolves to `222 47% 11% / 0.45` which might be invisible. Change to `text-foreground/60` or keep.

### 6. Update `tailwind.config.ts`

- Remove `accent-2` color (no longer needed for gradient endpoint)
- Update primary colors to use the new palette values

## Files to Modify

| File | Changes |
|---|---|
| `src/index.css` | New palette variables, remove all gradient CSS, remove pseudo-element overlays, simplify body background |
| `tailwind.config.ts` | Update primary/accent colors |
| `src/components/ui/button.tsx` | Remove gradient variants, use solid colors |
| `src/components/community/CommunityHeader.tsx` | Solid avatar bg |
| `src/components/groups/GroupHeroCard.tsx` | Remove gradient bg, fix text colors to white |
| `src/components/groups/GroupSessionsList.tsx` | Fix date badge colors |
| `src/pages/SessionDetails.tsx` | Solid creator avatar bg |
| `src/pages/UserProfile.tsx` | Solid profile avatar bg |
| `src/pages/GroupDetails.tsx` | Fix tag text colors |
| `src/components/spots/SpotCard.tsx` | Solid placeholder bg |

## Technical Details

### Gradient Removal Pattern

Before:
```text
background: linear-gradient(135deg, hsl(185 57% 52%), hsl(228 80% 58%));
```

After:
```text
background: #456789;
```

### Card Overlay Removal

Before (card-session has ::before and ::after pseudo-elements with radial gradients):
```text
.card-session::before {
  background: radial-gradient(circle, rgba(63, 189, 200, 0.28), transparent 62%);
}
.card-session::after {
  background: radial-gradient(circle, rgba(63, 102, 232, 0.22), transparent 62%);
}
```

After: Remove the ::before and ::after rules entirely, keeping the base card styling clean.

### Avatar Solid Color

Before:
```text
background: linear-gradient(135deg, hsl(185 57% 52%), hsl(228 80% 58%));
```

After:
```text
background: #234567;
```

### Scope

This is purely a visual change. No logic, database, routing, or functional changes. Only CSS variables, Tailwind classes, and component styling are affected.

