
# Fix Readability and Styling Issues from Deep Blue Theme

## Overview

After the deep blue theme restyling, many pages were not updated to handle the new dark card backgrounds. The core issue is: cards now use a dark navy background (`bg-card` = `#233A6B`), but text inside those cards still uses `text-foreground` (dark blue-ink `#0F172A`) or `text-muted` (which is also dark with alpha). This creates **dark text on dark backgrounds** -- nearly invisible text across the majority of the app.

The Community page cards (SessionCard, GroupCard) were updated during the restyling, but all other pages that use `bg-card` were left with the old dark text colors.

## Issues Found

### Category 1: Dark text on dark `bg-card` backgrounds (critical readability)

These pages/components use `bg-card` for containers but still have `text-foreground` and `text-muted` inside them, which are dark colors on a now-dark background:

| Page/Component | Location | Issue |
|---|---|---|
| **Create.tsx** | Option buttons | `bg-card` with `text-foreground` and `text-muted` text, plus `bg-primary/10` icon backgrounds invisible on dark |
| **Profile.tsx** | Profile card, Settings card | `bg-card` with `text-foreground`, `text-muted-foreground`, icon backgrounds like `bg-primary/10` |
| **Training.tsx** | Empty state card, Stats grid | `bg-card` with `text-foreground`, `text-muted`, `bg-primary/10` icon |
| **SessionDetails.tsx** | Session info card, Creator card, Participant cards | `bg-card` with `text-foreground`, `text-muted`, `bg-secondary/50` rows |
| **SpotDetails.tsx** | Hero card, Description card, Session cards | `bg-card` with `text-foreground`, `text-muted`, `bg-primary/10` badges |
| **GroupDetails.tsx** | Via GroupHeroCard, GroupSessionsList | Gradient overlay on `bg-card`, `text-foreground` and `text-muted` text |
| **GroupManage.tsx** | Member cards, Settings card | `bg-card` with `text-foreground`, `text-muted` |
| **MySessions.tsx** | Session cards, Created session cards | `bg-card` with `text-foreground`, `text-muted` |
| **UserProfile.tsx** | Profile card, Session/Group list cards | `bg-card` with `text-foreground`, `text-muted` |
| **DiscoverFreedivers.tsx** | User cards | `bg-card` with `text-foreground`, `text-muted-foreground` |
| **Admin.tsx** | Certification cards, User cards, Group cards | `bg-card` with dark text throughout |
| **EditSession.tsx** | Spot info card | `bg-card` with dark text |
| **PersonalBestsCard.tsx** | Entire card | `bg-card` with `text-foreground`, `text-muted-foreground`, `bg-primary/10` |
| **CertificationStatus.tsx** | Status badge | `bg-muted/10` with `text-muted` |
| **GroupSessionsList.tsx** | Session list items | `bg-card` with `text-foreground`, `text-muted` |
| **GroupHeroCard.tsx** | Hero area | Gradient background with `text-foreground`, `text-muted` |
| **SpotBubble.tsx** | Floating bubble | `bg-card/95` with `text-foreground`, `text-muted` |
| **SpotCard.tsx** | Spot info card | `text-foreground`, `text-muted`, `.badge-tag` (translucent white -- wrong context) |

### Category 2: Back button icons invisible

Many pages use this pattern for the back button:
```
className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
```
The `ChevronLeft` icon inherits `text-foreground` (dark) on the dark `bg-card` background, making the arrow invisible.

Affected: Profile, Settings, SessionDetails, CreateSession, EditSession, MySessions, UserProfile, GroupManage, Admin, Spots (filter button).

### Category 3: Input fields on dark card backgrounds

Forms that use `bg-card` for Input styling (Groups page search input, CreateGroup inputs, Spots floating search) have dark text typed into dark-background inputs.

### Category 4: Badge and chip styling wrong on light backgrounds

`.badge-tag` and `.badge-level` use translucent white text/backgrounds designed for dark cards, but SpotCard and SpotDetails use them outside of dark cards -- resulting in nearly-invisible white-on-light.

### Category 5: Hover states referencing `bg-secondary`

`bg-secondary` is a light surface. On dark `bg-card` containers, `hover:bg-secondary/50` creates an odd light flash. Needs to change to a subtle white alpha.

## Solution Approach

Instead of updating every single component's text classes one by one (which would be fragile and miss future components), the fix will use a **two-pronged approach**:

### Approach A: Make `bg-card` containers automatically set text color

In components where `bg-card` is used as a container (detail pages, forms, settings), change the card text classes to use `text-card-foreground` (which is white) instead of `text-foreground` (which is dark). Apply a utility class `.card-surface` that handles the text color flipping automatically.

### Approach B: Add a `.card-surface` utility class

Create a reusable CSS utility class that, when applied to any `bg-card` container, automatically flips its child text to light colors:

```css
.card-surface {
  color: hsl(var(--card-foreground));
}
.card-surface .text-foreground { color: rgba(255,255,255,0.92); }
.card-surface .text-muted { color: rgba(255,255,255,0.55); }
.card-surface .text-muted-foreground { color: rgba(255,255,255,0.55); }
```

However, this approach is fragile with Tailwind. The cleaner, more predictable solution is to explicitly fix each component.

### Chosen approach: Direct class fixes per component

Each affected component/page will have its card containers' text classes updated to use light colors when on `bg-card`. This gives us full control and avoids CSS specificity issues.

## Files to Modify

### 1. `src/index.css`
- Add `.card-surface` utility for back buttons and common card patterns
- Fix back-button styling globally

### 2. `src/pages/Create.tsx`
- Change option buttons from `text-foreground` / `text-muted` to `text-card-foreground` / `text-white/55`
- Change icon bg from `bg-primary/10` to `bg-white/10` when on card
- Fix back button contrast

### 3. `src/pages/Profile.tsx`
- Fix profile card: name, location, bio, role badge text colors
- Fix settings card: text colors, icon colors, hover states
- Fix back button

### 4. `src/pages/Training.tsx`
- Fix empty state card: heading, description, icon background
- Fix stats grid: value and label colors

### 5. `src/pages/SessionDetails.tsx`
- Fix session info card: title, spot, grid items, description
- Fix creator card: name, role text
- Fix participant status cards
- Fix participant list items (creator view)
- Fix back button

### 6. `src/pages/SpotDetails.tsx`
- Fix hero card: name, location, environment badge
- Fix description card
- Fix session list items: date, title, badges, participants
- Fix back button

### 7. `src/pages/GroupDetails.tsx`
- Fix description, tags section text (light on card)

### 8. `src/components/groups/GroupHeroCard.tsx`
- Fix text colors to light variants

### 9. `src/components/groups/GroupSessionsList.tsx`
- Fix session items: title, time, spots count, date badge colors

### 10. `src/pages/MySessions.tsx`
- Fix both SessionCard and CreatedSessionCard: title, spot, date/time, stats
- Fix back button

### 11. `src/pages/UserProfile.tsx`
- Fix profile card: name, location, bio, role badge, followers
- Fix session/group list cards
- Fix back button

### 12. `src/pages/DiscoverFreedivers.tsx`
- Fix user cards: name, location, activity summary

### 13. `src/pages/Admin.tsx`
- Fix certification cards, user cards, group cards text
- Fix back button

### 14. `src/pages/EditSession.tsx`
- Fix spot info card text
- Fix back button

### 15. `src/pages/GroupManage.tsx`
- Fix member cards, settings section text
- Fix back button

### 16. `src/pages/CreateSession.tsx`
- Fix back button
- Fix form on bg-background (this one should be fine since forms are on bg-background, not bg-card)

### 17. `src/pages/CreateGroup.tsx`
- Fix input fields that use `bg-card` (change to `bg-white/10` or remove bg-card from inputs)

### 18. `src/components/profile/PersonalBestsCard.tsx`
- Fix all text to light variants
- Fix icon backgrounds from `bg-primary/10` to `bg-white/10`
- Fix secondary elements

### 19. `src/components/certification/CertificationStatus.tsx`
- Fix text colors inside status cards

### 20. `src/components/spots/SpotBubble.tsx`
- Fix text colors to light variants

### 21. `src/components/spots/SpotCard.tsx`
- Fix `.badge-tag` usage (wrong context -- white on light background)

### 22. `src/pages/Groups.tsx`
- Fix search input (`bg-card` on Input)
- Fix "Nessun gruppo" text

### 23. `src/pages/Spots.tsx`
- Fix floating search/filter bar (`bg-card/90` with dark icons/text)

### 24. `src/pages/Settings.tsx`
- Fix back button

### 25. `src/pages/Onboarding.tsx`
- Most of this page uses `bg-background` (light) -- verify it's fine

### 26. `src/pages/Auth.tsx`
- Uses `bg-background` (light) -- should be fine, verify confirmation card

## Technical Details

### The pattern for fixing text on `bg-card`:

Before (broken):
```tsx
<div className="bg-card rounded-2xl border p-5">
  <h2 className="text-foreground">Title</h2>      // DARK on DARK
  <p className="text-muted">Description</p>        // DARK on DARK  
  <div className="bg-primary/10">                   // invisible tint
</div>
```

After (fixed):
```tsx
<div className="bg-card rounded-2xl border p-5">
  <h2 className="text-card-foreground">Title</h2>  // WHITE on DARK
  <p className="text-white/55">Description</p>     // LIGHT on DARK
  <div className="bg-white/10">                     // visible tint
</div>
```

### Back button fix pattern:

Before:
```tsx
<button className="w-10 h-10 rounded-full bg-card border flex items-center justify-center">
  <ChevronLeft className="w-5 h-5" />  // inherits dark text
</button>
```

After:
```tsx
<button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
  <ChevronLeft className="w-5 h-5 text-foreground" />  // dark icon on light bg
</button>
```

### Input fields on card backgrounds:

Change `bg-card` on inputs to default `bg-background` or `bg-white/90` so text remains readable.

### Scope

This is purely a visual/CSS fix. No logic, database, routing, or functional changes. Only Tailwind classes in TSX files are affected.
