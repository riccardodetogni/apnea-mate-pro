

# Rimuovere annuncio "5 secondi" nella respirazione quadratica

## Problema

Con fasi brevi (es. 6 secondi), la voce dice "5 secondi" quasi subito dopo l'annuncio della fase, creando sovrapposizione audio. Il 3-2-1 va bene e resta.

## Soluzione

Rimuovere il 5 dai threshold del countdown per la respirazione quadratica. Due approcci possibili, scelgo il più semplice: passare il `mode` al timer hook e escludere il 5 quando è quadratic.

## Modifiche

### 1. `src/hooks/useTrainingTimer.ts`
- Aggiungere `mode?: TrainingMode` alle props
- In `getCountdownThresholds`: se `mode === "quadratic"`, restituire solo `[3, 2, 1]` (niente 5, 10, 20, 30)

### 2. `src/components/training/TrainingTimer.tsx`
- Passare `mode` al hook: `useTrainingTimer({ steps, mode, ... })`

2 file, modifiche minime. La preparazione 5s resta, il 3-2-1 resta, solo gli annunci vocali "5 secondi", "10 secondi" ecc. vengono rimossi per quadratic.

