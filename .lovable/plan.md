

# Save & Load Custom Training Presets

## Overview

Allow users to save their configured training tables (CO2 or Quadratic) with a custom name, then quickly load them from the config screen. Presets are stored in the database, tied to the user's account, so they persist across devices.

---

## Database

### New table: `training_presets`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, references the authenticated user |
| `name` | text | NOT NULL, user-chosen label (e.g. "My CO2 Advanced") |
| `mode` | text | NOT NULL, either `"co2"` or `"quadratic"` |
| `config` | jsonb | NOT NULL, stores either `Co2TableConfig` or `QuadraticConfig` values |
| `custom_rows` | jsonb | NULL, for CO2 mode only -- stores manually edited per-row `[{breathe, hold}]` array |
| `created_at` | timestamptz | default `now()` |

### RLS policies
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

## UX Flow

### Saving a preset
- On both CO2 and Quadratic config screens, add a **"Save"** button (bookmark icon) next to the "Start Training" button.
- Tapping it opens a small dialog asking for a name (text input + confirm).
- The current slider values (and custom rows for CO2) are saved to the database.

### Loading a preset
- On both config screens, a **"My Presets"** section appears above the sliders if the user has saved presets for that mode.
- Each preset shown as a small chip/card with the name and a brief summary (e.g. "8 rounds, 2:00 hold" or "4-4-4-4, 10 rounds").
- Tapping a preset loads its config into the sliders (and custom rows if present).
- Long-press or swipe/trash icon to delete a preset.

---

## Technical Details

### New files

| File | Purpose |
|------|-------|
| `src/hooks/useTrainingPresets.ts` | Hook to CRUD presets from the database using `supabase` client + `react-query` |

### Modified files

| File | Change |
|------|--------|
| `src/components/training/Co2TableConfig.tsx` | Add save button, presets list, load logic |
| `src/components/training/QuadraticConfig.tsx` | Add save button, presets list, load logic |
| `src/types/training.ts` | Add `TrainingPreset` interface |
| `src/lib/i18n.ts` | Add i18n keys: savePreset, presetName, myPresets, deletePreset, presetSaved, etc. |

### `useTrainingPresets` hook API

```typescript
const {
  presets,        // TrainingPreset[] filtered by mode
  isLoading,
  savePreset,     // (name, mode, config, customRows?) => Promise
  deletePreset,   // (id) => Promise
} = useTrainingPresets(mode: TrainingMode);
```

- Uses `useQuery` to fetch presets for the current user filtered by mode.
- Uses `useMutation` for save and delete with query invalidation.

### Config component changes

Both `Co2TableConfig` and `QuadraticConfig` will:
1. Call `useTrainingPresets("co2")` / `useTrainingPresets("quadratic")`
2. Render a horizontal scroll of preset chips above the sliders (if any exist)
3. On chip tap: set local state from `preset.config` (and `preset.custom_rows` for CO2)
4. Add a save button that opens a Dialog with a name input
5. Add a delete icon on each preset chip

