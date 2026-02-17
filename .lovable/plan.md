

# Full Color and Gradient Consistency Fix

The previous pass fixed some outer containers but missed the inner elements. Here's everything still inconsistent:

## 1. GroupHeroCard.tsx -- Missing gradient + hardcoded colors
- Line 28: `bg-card border border-white/8` -- needs `card-session` class with overrides
- Line 44: `text-white/55` -- needs `text-[hsl(var(--card-muted))]`
- Line 49: `text-white/55` -- same
- Line 54: `text-white/20` -- needs `text-[hsl(var(--card-border))]`
- Line 75: `bg-white/10 text-white/85` -- needs semantic tokens
- Line 80: `bg-white/10 text-white/55` -- needs semantic tokens

## 2. GroupSessionsList.tsx -- Missing gradient + hardcoded colors
- Line 50: `bg-card border border-white/8` -- needs `card-session` with flex overrides
- Line 53: `bg-white/10` -- needs `bg-[hsl(var(--badge-blue-bg))]`
- Line 54: `text-white/70` -- needs `text-[hsl(var(--card-soft))]`
- Line 57: `text-white/90` -- needs `text-card-foreground`
- Line 65: `text-white/55` -- needs `text-[hsl(var(--card-muted))]`
- Line 74: `text-white/55` -- same
- Line 80: `text-white/55` -- same

## 3. GroupDetails.tsx -- Tags hardcoded
- Line 189: `bg-primary/10 text-primary` -- needs `badge-tag` class

## 4. SpotDetails.tsx -- Missing gradient + hardcoded colors on all cards
- Line 194: hero section `bg-card border border-white/8` -- needs `card-session`
- Line 196: `bg-white/10` -- needs semantic token
- Line 201: `text-white/55` -- needs semantic token
- Line 206: `bg-white/10 text-primary` -- badge needs fix
- Line 217-219: description card same issues
- Line 263-265: empty session card hardcoded colors
- Lines 277, 285, 287: session cards missing gradient + hardcoded colors

## 5. SessionDetails.tsx -- Missing gradient + hardcoded colors on all cards
- Line 372: info card `bg-card border border-white/8` -- needs `card-session`
- Line 377, 389, 393, 397, 401: `text-white/55`, `text-white/70` -- needs semantic tokens
- Line 407: `border-white/8` -- needs semantic token
- Line 414: creator card same issues
- Line 430: `text-white/55`
- Line 483, 492, 545, 555: participant list containers + items hardcoded
- Line 582: `text-white/55`

## 6. MySessions.tsx -- "Creata da te" badge visibility
- Line 126: `text-primary` on dark card -- needs `text-[hsl(var(--card-foreground))]` for visibility

## Plan of Changes

### GroupHeroCard.tsx
- Replace outer div with `card-session !rounded-2xl !p-0` and wrap content in a relative div
- Replace all `text-white/55` with `text-[hsl(var(--card-muted))]`
- Replace `text-white/20` with `text-[hsl(var(--card-border))]`
- Replace `bg-white/10` with `bg-[hsl(var(--badge-blue-bg))]`

### GroupSessionsList.tsx
- Apply `card-session` to each session button with `!p-3 !flex-row !items-center !gap-3`
- Replace all hardcoded white opacity colors with semantic tokens

### GroupDetails.tsx
- Replace tag styling `bg-primary/10 text-primary` with `badge-tag` class

### SpotDetails.tsx
- Apply `card-session` to hero section, description card, empty session state, and each session card
- Replace all `text-white/55`, `bg-white/10`, `border-white/8` with semantic tokens

### SessionDetails.tsx
- Apply `card-session` to session info card, creator card, pending list, and confirmed list containers
- Replace all `text-white/55`, `text-white/70`, `bg-white/10`, `border-white/8` with semantic tokens

### MySessions.tsx
- Change "Creata da te" badge from `text-primary` to `text-[hsl(var(--card-foreground))]`

This covers all remaining inconsistencies across the entire app where hardcoded colors and missing gradients exist on dark card backgrounds.
