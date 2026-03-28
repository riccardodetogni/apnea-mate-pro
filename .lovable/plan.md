

# Fix: Confirmation Screen Colors

## Problem

The confirmation info box on line 221-226 uses `bg-card` (dark navy) with `text-muted` text, making the content barely readable against the dark background. The card needs to use proper contrast colors for dark card backgrounds.

## Fix

In `src/pages/Auth.tsx` (lines 221-226):
- Change `text-muted` inside the dark card to `text-card-foreground/70` so text is legible on the navy background
- Alternatively, use a lighter background like `bg-muted/10` with `text-muted-foreground` to keep a subtle info box that's readable

**Recommended approach**: Change the info box to use `bg-card` with `text-card-foreground/70` for the paragraph text, ensuring proper contrast on the dark navy card.

### File: `src/pages/Auth.tsx`
- Line 222: Change `text-muted` → `text-card-foreground/70`

