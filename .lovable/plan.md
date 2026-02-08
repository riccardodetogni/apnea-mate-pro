

# Restyle Apnea Mate -- Deep Blue Minimalistic Theme

## Overview

Restyle the entire app to match the new HTML reference design: **dark navy cards** with gradient overlays, a **teal-to-blue accent gradient**, **glassmorphic surfaces**, and a cleaner, more premium feel. The background gets subtle radial gradient washes for depth.

## Color Palette (from reference)

| Token | Current | New |
|---|---|---|
| Background | `#F0F3F8` (light blue-gray) | `#F7F9FC` with radial gradient washes (teal + blue) |
| Card | `#FFFFFF` (white) | `#233A6B` (deep navy) -- cards become **dark** |
| Card text | dark text | `rgba(255,255,255,0.92)` -- **white on dark** |
| Primary/Accent | `#3B82F6` (single blue) | Gradient: `#3FBDC8` teal to `#3F66E8` blue |
| Foreground | `hsl(215,25%,17%)` | `#0F172A` (blue-ink, deeper) |
| Muted text | gray-blue | `rgba(15,23,42,0.45)` |
| Border | `rgba(0,0,0,0.08)` | `rgba(15,23,42,0.10)` |
| Shadows | subtle | Deeper: `0 10px 26px rgba(15,23,42,0.22)` on cards |

## What Changes

### 1. CSS Variables (`src/index.css`)

Rewrite the `:root` block with the new palette. Key shifts:

- `--card` becomes the deep navy `#233A6B` (converted to HSL)
- `--card-foreground` becomes near-white
- New variables for card-specific text tiers: `--card-soft`, `--card-muted`, `--card-border`
- `--accent` shifts from green to the teal `#3FBDC8`
- New `--gradient` CSS custom property for the teal-to-blue gradient
- `--primary-deep` and `--primary-light` remap to `#3F66E8` and `#3FBDC8`
- Shadows get stronger with the blue-ink tint
- Background gets a subtle radial gradient applied via `body` styles
- Surfaces (search bar, chips, nav) get glassmorphic `backdrop-filter: blur()`
- Dark mode adjustments to deepen further

### 2. Component-level CSS classes (`src/index.css`)

Update the `@layer components` section:

- **`.card-session` / `.card-group`**: Dark background with the `::before` / `::after` radial gradient overlays from the reference (teal and blue glows at corners)
- **`.card-empty`**: Use `--surface` (translucent white with blur) instead of solid white
- **`.badge-level` / `.badge-spots`**: Switch to translucent white-on-dark style (`rgba(255,255,255,0.10)` background, subtle border)
- **`.chip-session`**: Same translucent approach on dark cards
- **`.avatar-creator` / `.avatar-group`**: Translucent white backgrounds on dark cards
- **`.search-bar`**: Glassmorphic surface (`rgba(255,255,255,0.86)` + `backdrop-filter: blur(10px)`)
- **`.chip-filter`**: Same glassmorphic surface
- **`.bottom-nav-inner`**: Glassmorphic with stronger shadow (`0 14px 32px rgba(15,23,42,0.14)`)
- **`.btn-primary-gradient`**: Use the new teal-to-blue gradient with border highlight
- **Active nav indicator**: Add gradient underline bar (`::after` pseudo-element) for the active tab

### 3. Tailwind Config (`tailwind.config.ts`)

- Add a new `accent-2` color for the blue end of the gradient
- Update shadow values to match the new deeper card shadow

### 4. Component Updates (Tailwind classes in TSX)

Since cards are now dark, text inside them needs to flip to light. The components that render inside cards need class adjustments:

- **`SessionCard.tsx`**: Change text colors from `text-foreground` / `text-muted` to card-specific light classes (`text-white/90`, `text-white/70`, `text-white/55`). Chips and badges get translucent white styles.
- **`GroupCard.tsx`**: Same text-on-dark treatment. Group avatar and tags get translucent styles.
- **`EmptyCard.tsx`**: Switch to glassmorphic light surface (stands out as different from dark cards).
- **`CommunityHeader.tsx`**: Avatar gets gradient background with white border glow shadow.
- **`SearchBar.tsx`**: Add glassmorphic background classes.
- **`SectionHeader.tsx`**: "View all" link color changes to `--blue-ink` (deeper).
- **`BottomNav.tsx`**: Active state uses blue-ink color + gradient underline bar. Add glassmorphic treatment.

### 5. AppLayout Background

Add the subtle radial gradient background from the reference (teal glow top-center, blue glow top-right) as a CSS background on `body` or the app wrapper.

### 6. Button Variants (`button.tsx`)

- `primaryGradient` variant: Update gradient from the old blue to the new teal-to-blue with white border highlight and stronger shadow.
- `pill` variant: Same gradient update.

## Files Modified

| File | Changes |
|---|---|
| `src/index.css` | Complete `:root` variable rewrite, new component classes, body background gradient, glassmorphic utilities, card overlay pseudo-elements |
| `tailwind.config.ts` | New color tokens, updated shadow values |
| `src/components/ui/button.tsx` | Updated gradient variant colors |
| `src/components/community/SessionCard.tsx` | Text colors flipped to white-on-dark |
| `src/components/community/GroupCard.tsx` | Text colors flipped to white-on-dark |
| `src/components/community/EmptyCard.tsx` | Glassmorphic surface styling |
| `src/components/community/CommunityHeader.tsx` | Avatar gradient shadow, minor color tweaks |
| `src/components/community/SearchBar.tsx` | Glassmorphic surface classes |
| `src/components/layout/BottomNav.tsx` | Glassmorphic nav + gradient active indicator |
| `src/components/layout/AppLayout.tsx` | Background gradient wrapper |

## Technical Details

### Card Overlay Effect (the "catchy" glow)

Each dark card gets `position: relative; overflow: hidden;` and two pseudo-element radial gradients:

```text
::before -- teal glow (top-right corner)
  radial-gradient(circle, rgba(63,189,200,0.28), transparent 62%)

::after -- blue glow (bottom-right corner)
  radial-gradient(circle, rgba(63,102,232,0.22), transparent 62%)
```

This is applied via CSS in the `.card-session` and `.card-group` classes so no JSX changes are needed for the effect itself.

### Glassmorphism

Search bar, filter chips, and bottom nav use:
```text
background: rgba(255,255,255,0.86)
backdrop-filter: blur(14px)
border: 1px solid rgba(15,23,42,0.10)
```

### Gradient Reference

The brand gradient `linear-gradient(135deg, #3FBDC8, #3F66E8)` is used for:
- Primary buttons
- Avatar fallback backgrounds
- Active nav indicator bar
- Button shadows get a blue-tinted glow

### Scope

This is a **visual-only** change. No logic, database, routing, or functional changes. Only CSS variables, Tailwind classes, and component styling classes are affected.

