

# Add O2 Table Training Mode + Calmer Voice

## Summary

Add an "O2 Table" training mode — the inverse of CO2: constant recovery/breathe time with incrementally increasing hold times. Also tune the voice to be calmer.

## O2 Table Logic

CO2 Table: constant hold, decreasing breathe time
O2 Table: constant breathe time, increasing hold time

```text
Example O2 Table (8 rounds, start hold 60s, breathe 120s, increase 15s):
Round 1: Breathe 2:00 → Hold 1:00
Round 2: Breathe 2:00 → Hold 1:15
Round 3: Breathe 2:00 → Hold 1:30
...
```

## Changes

### 1. `src/types/training.ts`
- Add `"o2"` to `TrainingMode` union
- Add `O2TableConfig` interface: `{ rounds, startHoldSeconds, breathSeconds, increaseStep }`
- Add `generateO2Steps(config)`: constant breathe time, hold increases each round

### 2. `src/components/training/O2TableConfig.tsx` (new)
- Clone of `Co2TableConfig` adapted for O2:
  - Sliders: rounds, start hold time, breathe time, increase step
  - Editable preview table (same click-to-edit pattern)
  - Presets via `useTrainingPresets("o2")`
  - Same bookmark/save/update dialogs

### 3. `src/pages/Training.tsx`
- Add `"o2-config"` to `Screen` type
- Add O2 card on home (between CO2 and Quadratic, with a distinct color — orange/amber)
- Add `handleStartO2` handler
- Render `O2TableConfig` when `screen === "o2-config"`

### 4. `src/components/training/TrainingTimer.tsx`
- Show `TrainingStepTable` for both `mode === "co2"` and `mode === "o2"` (same breathe+hold format)

### 5. `src/lib/i18n.ts`
- Add keys: `o2Table` (IT: "Tabella O2" / EN: "O2 Table"), `o2TableDesc` (IT: "Recupero costante, apnea crescente" / EN: "Constant recovery, increasing hold"), `increaseStep` (IT: "Incremento" / EN: "Increase step"), `startHoldTime` (IT: "Apnea iniziale" / EN: "Starting hold")

### 6. `src/hooks/useTrainingAudio.ts` — calmer voice
- Lower `utterance.rate` from `0.85` to `0.75`
- Lower `utterance.pitch` from `0.95` to `0.85`
- Lower `utterance.volume` from `1` to `0.9`

