

# Breathing Training Feature

## Overview

Transform the Training tab into a full breathing exercise trainer with two modes: **CO2 Tables** and **Quadratic Breathing**. Includes a visual countdown timer, step table, audio beeps, and voice announcements using the browser's built-in Speech Synthesis API (no external API keys needed).

---

## Two Training Modes

### 1. CO2 Table
A series of breath-hold cycles where hold time stays constant and breathing (recovery) time decreases each round, training CO2 tolerance.

- **Default**: 8 rounds, hold = 2:00, breath starts at 2:00 and decreases by 15s each round (minimum 15s)
- **Customizable**: number of rounds, hold duration, starting breath time, decrease step
- User can also create custom tables with manual per-row values

### 2. Quadratic Breathing (Box Breathing)
A 4-phase cycle: Inhale - Hold - Exhale - Hold, repeated for N rounds.

- **Default**: 4s inhale, 4s hold, 4s exhale, 4s hold, 10 rounds
- **Customizable**: each phase duration independently, number of rounds

---

## Audio and Voice

All audio runs client-side using browser built-in APIs -- no API keys or external services required:

- **Web Speech API** (`window.speechSynthesis`) for voice: "Breathe", "Hold", "Exhale", "10 seconds remaining", "3", "2", "1"
- **Web Audio API** (`AudioContext`) for beep/tick sounds on phase transitions and countdown ticks
- Volume toggle to mute/unmute

---

## Screen Flow

```text
/training (main)
  |-- Mode selection: CO2 Table | Quadratic Breathing
  |
  |-- [CO2 Table selected]
  |     |-- Configuration screen (rounds, hold time, breath time, step)
  |     |-- Preview table (like the reference screenshot)
  |     |-- Start -> Active timer screen
  |
  |-- [Quadratic selected]
  |     |-- Configuration screen (inhale, hold, exhale, hold, rounds)
  |     |-- Start -> Active timer screen
  |
  |-- Active Timer Screen:
        |-- Large circular countdown (like reference app)
        |-- Current phase label ("Hold" / "Breathe" / "Inhale" / "Exhale")
        |-- Current round indicator
        |-- Step table below with active row highlighted (CO2 mode)
        |-- Pause / Resume / Stop controls
```

---

## UI Components

### Training Home (`src/pages/Training.tsx`)
- Replace current empty state with mode selection cards
- Two cards: "CO2 Table" and "Quadratic Breathing" with icons and descriptions
- History section placeholder for future training logs

### CO2 Table Config (`src/components/training/Co2TableConfig.tsx`)
- Form with sliders/inputs: rounds (4-12), hold time, start breath time, decrease step
- Preview table showing all rounds with computed hold/breath times
- "Start Training" button

### Quadratic Config (`src/components/training/QuadraticConfig.tsx`)
- Form with sliders for each phase (inhale, hold1, exhale, hold2) in seconds (1-20s)
- Rounds selector (1-30)
- Visual preview of one cycle
- "Start Training" button

### Timer Screen (`src/components/training/TrainingTimer.tsx`)
- Large circular progress indicator (SVG circle with stroke-dasharray animation)
- Big countdown text (MM:SS or just seconds for short phases)
- Phase label with color coding (blue = breathe/inhale, orange/red = hold, green = exhale)
- Round progress (e.g. "Round 3/8")
- Controls: Pause/Resume, Stop (with confirmation)
- For CO2 mode: table below timer showing all rows, current row highlighted with play icon (like reference)

### Audio Engine (`src/hooks/useTrainingAudio.ts`)
- Hook managing Web Speech API for voice and Web Audio API for beeps
- `speak(text)` -- says "Breathe", "Hold", "Exhale"
- `beep(frequency, duration)` -- short beep for transitions
- `countdown(seconds)` -- voice "3, 2, 1" and "10 seconds remaining"
- Mute/unmute state
- Cleanup on unmount

### Timer Logic (`src/hooks/useTrainingTimer.ts`)
- Core timer hook managing the training session state
- Tracks: current phase, current round, seconds remaining, paused state, completed
- Handles phase transitions (breath -> hold -> breath for CO2; inhale -> hold -> exhale -> hold for quadratic)
- Triggers audio callbacks at phase start, 10s remaining, and final 3-2-1
- Uses `requestAnimationFrame` or `setInterval` with drift correction for accuracy

---

## Data Model

No database tables needed initially -- this is a local, in-session feature. Training configs can be stored in component state. Future enhancement: save training history to database.

Types defined in `src/types/training.ts`:

```typescript
type TrainingMode = "co2" | "quadratic";

interface Co2TableConfig {
  rounds: number;
  holdSeconds: number;
  startBreathSeconds: number;
  decreaseStep: number;
}

interface QuadraticConfig {
  inhaleSeconds: number;
  hold1Seconds: number;
  exhaleSeconds: number;
  hold2Seconds: number;
  rounds: number;
}

type TrainingPhase = "inhale" | "hold" | "exhale" | "breathe";

interface TrainingStep {
  phase: TrainingPhase;
  durationSeconds: number;
  round: number;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/training.ts` | Type definitions |
| `src/hooks/useTrainingAudio.ts` | Voice + beep audio engine |
| `src/hooks/useTrainingTimer.ts` | Timer state machine |
| `src/components/training/Co2TableConfig.tsx` | CO2 table setup form + preview |
| `src/components/training/QuadraticConfig.tsx` | Quadratic breathing setup form |
| `src/components/training/TrainingTimer.tsx` | Active timer with circular progress |
| `src/components/training/CircularProgress.tsx` | SVG circular countdown component |
| `src/components/training/TrainingStepTable.tsx` | Step table for CO2 mode (like reference) |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Training.tsx` | Replace empty state with mode selection + timer integration |
| `src/lib/i18n.ts` | Add training-related translation keys (IT + EN) |

---

## i18n Keys to Add

Italian and English translations for: breathe, hold, exhale, inhale, co2Table, quadraticBreathing, rounds, holdTime, breathTime, decreaseStep, startTraining, pauseTraining, resumeTraining, stopTraining, trainingComplete, round, phase names, configuration labels, "10 seconds remaining", etc.

---

## Design Details

- Circular timer uses SVG with animated `stroke-dashoffset` matching the app's primary gradient colors
- Phase colors: Inhale/Breathe = `--primary` (blue), Hold = `--warning` (amber), Exhale = `--success` (green)
- All cards use `card-session` class for gradient consistency
- Controls use existing Button variants (`primaryGradient`, `pillOutline`)
- Config forms use existing Slider and Input components
- Keep Screen Awake: use `navigator.wakeLock` API during active training to prevent screen from turning off

