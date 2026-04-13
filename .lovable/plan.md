

# Aggiungere annunci vocali a 1 min, 1:30, 2 min, 2:30 + fix visibilità timer

## Problema 1: Timer non visibile all'avvio
Scroll-to-top all'avvio del timer + nascondere BottomNav durante il training.

## Problema 2: Annunci vocali per fasi lunghe
Attualmente gli annunci arrivano solo a 30, 20, 10, 5, 3, 2, 1 secondi dalla fine. Per fasi lunghe (es. 2 minuti di hold) servono annunci anche a 2:30, 2:00, 1:30, 1:00.

## Modifiche

### 1. `src/hooks/useTrainingTimer.ts` — aggiungere threshold per minuti
In `getCountdownThresholds`, per fasi > 60s aggiungere 150, 120, 90, 60 ai threshold esistenti:
- `phaseDuration > 150` → `[150, 120, 90, 60, 30, 20, 10, 5, 3, 2, 1]`
- `phaseDuration > 120` → `[120, 90, 60, 30, 20, 10, 5, 3, 2, 1]`
- `phaseDuration > 90` → `[90, 60, 30, 20, 10, 5, 3, 2, 1]`
- `phaseDuration > 60` → `[60, 30, 20, 10, 5, 3, 2, 1]`
- Per quadratic: solo `[3, 2, 1]` (invariato)

### 2. `src/hooks/useTrainingAudio.ts` — aggiungere frasi per minuti
In `speakCountdown`, aggiungere casi per 150, 120, 90, 60:
- 150 → "2 minuti e 30" / "2 minutes 30"
- 120 → "2 minuti" / "2 minutes"
- 90 → "1 minuto e 30" / "1 minute 30"
- 60 → "1 minuto" / "1 minute"

### 3. `src/components/training/TrainingTimer.tsx` — scroll to top
Aggiungere `window.scrollTo(0, 0)` nel useEffect di auto-start.

### 4. `src/pages/Training.tsx` + `src/components/layout/AppLayout.tsx` — nascondere BottomNav
Passare prop `hideNav` ad AppLayout quando si è nella schermata timer.

4 file, modifiche semplici.

