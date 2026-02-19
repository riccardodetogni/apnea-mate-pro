

# Fix Create Page Colors, Preset Styling & Selection State

## Issues to Fix

1. **Create page icon backgrounds lack gradients** -- currently using flat `bg-white/10`, should use gradient backgrounds matching the app's design system.
2. **Preset card title text is black (unreadable)** -- the `text-foreground` class resolves to a dark color on the card background; needs to use `text-card-foreground` or explicit white.
3. **No visual feedback for selected preset** -- need to track which preset is active and highlight it with a border/glow.
4. **Saving after modifying a loaded preset** -- the bookmark button should always be available (it already is), but we should track that the user has diverged from the loaded preset so they can "Save as new".

---

## Changes

### 1. `src/pages/Create.tsx` -- Gradient icon backgrounds

Replace the flat `bg-white/10` icon containers with gradient backgrounds:
- Session: teal-to-blue gradient (primary)
- Group: green gradient (success)
- Training: amber/orange gradient (warning)

### 2. `src/components/training/Co2TableConfig.tsx`

- Add `selectedPresetId` state (string | null), set it when a preset is loaded, clear it when sliders change or table cells are edited.
- Update preset chip styling: selected preset gets `border-primary` ring/border, unselected stays default.
- Change preset name text from `text-foreground` to `text-card-foreground` for readability on dark cards.

### 3. `src/components/training/QuadraticConfig.tsx`

- Same changes: add `selectedPresetId` state, highlight selected chip, fix text color.
- Clear selection when any slider changes.

---

## Technical Details

### Create.tsx icon colors
```
Session: "bg-gradient-to-br from-primary/30 to-primary/10 text-primary"
Group:   "bg-gradient-to-br from-success/30 to-success/10 text-success"
Training:"bg-gradient-to-br from-warning/30 to-warning/10 text-warning"
```

### Preset card selected state
Selected chip gets: `border-primary/60 ring-1 ring-primary/30`
Unselected chip stays: default `card-session` border

### Selection tracking logic
- `loadPreset(p)` sets `selectedPresetId = p.id`
- `updateConfig(...)` (slider change) sets `selectedPresetId = null`
- In CO2: `handleCellBlur(...)` (manual table edit) also sets `selectedPresetId = null`
- The bookmark save button always works, saving the current state as a new preset regardless of selection

