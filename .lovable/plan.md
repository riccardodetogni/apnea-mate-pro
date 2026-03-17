

# Fix Create Page Icons, Preset Selection Style & Save/Update Flow

## Issues

1. **Create page icon "bubbles" are all blue** -- The gradient classes use `primary` which is blue. The icons inside Training.tsx use `badge-blue-bg` (translucent white). Need distinct, vivid colors per category.
2. **Preset selection highlight is too subtle** -- Should use the same teal-to-blue gradient background (like the "Unisciti"/"Start Training" buttons) to clearly show which preset is active.
3. **No way to update an existing preset** -- When a preset is loaded and then modified, the user needs two clear options: "Save changes to this preset" or "Save as new preset".

---

## Changes

### 1. Create.tsx -- Distinct icon bubble colors

Replace the current gradient classes with vivid, distinct backgrounds. The `primary` color is blue (HSL 228 80% 58%), so all three look the same. Fix:
- Session: use teal/accent (`bg-[hsl(185,57%,52%)]/20 text-[hsl(185,57%,52%)]`)
- Group: use green/success (`bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)]`)
- Training: use amber/warning (`bg-[hsl(38,92%,50%)]/20 text-[hsl(38,92%,50%)]`)

### 2. Training.tsx -- Also fix the icon bubbles on the training home screen

The CO2 and Quadratic cards both use `bg-[hsl(var(--badge-blue-bg))]` which is the same translucent white. Give them distinct icon colors:
- CO2: teal accent background
- Quadratic: green background

### 3. Preset chips -- Selected state uses gradient background

When a preset is selected, instead of a subtle border ring, apply the `btn-primary-gradient` style (teal-to-blue gradient) to the chip so it visually matches "active" elements elsewhere. Unselected chips keep the default `card-session` dark navy look.

Selected preset chip classes: `!bg-gradient-to-br !from-[#3fbdc8] !to-[#3f66e8] border-white/30` (matching `btn-primary-gradient`).

### 4. Save/Update preset flow

Add an `updatePreset` mutation to `useTrainingPresets` that updates an existing preset by ID.

When a preset is loaded and then modified (slider or table edit), track a `hasModified` boolean. When the user taps the bookmark button:
- If `selectedPresetId` is set AND `hasModified` is true: show a dialog with two buttons -- "Aggiorna preset" (update existing) and "Salva come nuovo" (save as new with name input).
- If no preset is selected: show the current "save new" dialog.

### 5. i18n keys

Add new keys:
- `updatePreset`: "Aggiorna preset" / "Update preset"
- `saveAsNew`: "Salva come nuovo" / "Save as new"
- `presetModified`: "Hai modificato il preset" / "You modified the preset"
- `presetUpdated`: "Preset aggiornato!" / "Preset updated!"

---

## Technical Details

### useTrainingPresets.ts changes

Add `updatePreset` mutation:
```typescript
const updatePreset = useMutation({
  mutationFn: async ({ id, config, customRows }: {
    id: string;
    config: Co2TableConfig | QuadraticConfig;
    customRows?: { breathe: number; hold: number }[] | null;
  }) => {
    const { error } = await supabase
      .from("training_presets")
      .update({ config, custom_rows: customRows ?? null })
      .eq("id", id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["training-presets", mode] });
    toast.success(t("presetUpdated"));
  },
});
```

### Co2TableConfig.tsx and QuadraticConfig.tsx changes

State additions:
- `hasModified: boolean` -- set to `true` when sliders/cells change while a preset is selected, reset to `false` when loading a preset.

Bookmark button logic:
- If `selectedPresetId && hasModified`: open a choice dialog with "Update preset" and "Save as new" buttons.
- If no preset selected: open the existing name-input save dialog.

Selected preset chip styling:
- Selected: `!bg-gradient-to-br !from-[#3fbdc8] !to-[#3f66e8] !border-white/30` (removes `card-session` dark bg, applies gradient)
- Unselected: default `card-session` styling

### Files to modify
- `src/pages/Create.tsx` -- icon colors
- `src/pages/Training.tsx` -- icon colors
- `src/hooks/useTrainingPresets.ts` -- add `updatePreset` mutation
- `src/components/training/Co2TableConfig.tsx` -- preset selection style, save/update flow
- `src/components/training/QuadraticConfig.tsx` -- preset selection style, save/update flow
- `src/lib/i18n.ts` -- new keys

