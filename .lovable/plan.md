

## Training Improvements Plan

Four enhancements requested by users:

### 1. Preparation Phase (countdown before training starts)
Currently the timer auto-starts immediately on mount. Add a 5-second preparation countdown screen that shows before the first step begins, with a voice announcement ("Preparati" / "Get ready") and a visible 5-4-3-2-1 countdown.

**Changes:**
- `useTrainingTimer.ts`: Add a `preparation` state (5s countdown) before `isRunning`. New field `isPreparation: boolean` in `TimerState`. The `start()` method enters preparation mode; after 5s it transitions to the first real step.
- `TrainingTimer.tsx`: Render a distinct preparation screen (phase label "Preparati", circular countdown from 5).
- `useTrainingAudio.ts`: Add `speakPreparation()` that says "Preparati" / "Get ready".
- `types/training.ts`: Add `isPreparation` to `TimerState`.
- `i18n.ts`: Add keys `getReady` → "Preparati" / "Get ready".

### 2. Slower, calmer voice
The Web Speech API `rate` is currently `1`. Lower it to `0.85` for a more relaxed pace. Also prefer voices with "female" or calmer quality when available by scoring voices and preferring ones that match better.

**Changes:**
- `useTrainingAudio.ts`: Set `utterance.rate = 0.85`, `utterance.pitch = 0.95`. Improve voice selection to prefer higher-quality voices (e.g., those with `localService: false` or names containing "Siri", "Google" which tend to sound smoother).

### 3. More countdown announcements during long holds
Currently only announces at 10s and 3-2-1. Add announcements at 30s and 20s for phases longer than 30s, and at 5s always.

**Changes:**
- `useTrainingTimer.ts`: Expand countdown trigger logic: if phase duration > 60s, announce at 30, 20, 10, 5, 3, 2, 1. If > 30s, announce at 20, 10, 5, 3, 2, 1. Otherwise keep 10, 5, 3, 2, 1.
- `useTrainingAudio.ts` → `speakCountdown`: Handle 30, 20, 5 in addition to 10 and 3-2-1.
- `TrainingTimer.tsx`: Remove the CO2-only restriction on countdown — enable for all modes (the user wants time references during long holds regardless of mode).

### 4. Optional background music
Add a toggle for royalty-free ambient/relaxation music. Bundle 1-2 short looping audio files (CC0/public domain) in `public/audio/` and loop them via an `<audio>` element.

**Changes:**
- Add 2 royalty-free ambient loops as static assets in `public/audio/` (e.g., `ocean-ambient.mp3`, `calm-focus.mp3`). These will be short (~30-60s) CC0 tracks that loop seamlessly.
- `useTrainingAudio.ts`: Add `backgroundMusic` state, `playMusic(track)`, `stopMusic()`, `toggleMusic()`. Uses an `HTMLAudioElement` with `loop = true` and lower volume (~0.15).
- `TrainingTimer.tsx`: Add a music toggle button (🎵 icon) next to the mute button. Show a small popover or dropdown to pick between "Ocean" / "Focus" / "Off".
- `i18n.ts`: Add keys `backgroundMusic`, `musicOcean`, `musicFocus`, `musicOff`.

### Files to modify
1. `src/types/training.ts` — add `isPreparation` to `TimerState`
2. `src/hooks/useTrainingTimer.ts` — preparation phase, expanded countdowns
3. `src/hooks/useTrainingAudio.ts` — slower voice, preparation speech, background music
4. `src/components/training/TrainingTimer.tsx` — preparation UI, music toggle, enable countdown for all modes
5. `src/lib/i18n.ts` — new translation keys
6. `public/audio/` — add 2 ambient loop files

