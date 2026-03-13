import { useState, useRef, useCallback, useEffect } from "react";
import { TrainingStep, TimerState } from "@/types/training";

const PREPARATION_SECONDS = 5;

interface UseTrainingTimerProps {
  steps: TrainingStep[];
  onPhaseChange?: (step: TrainingStep) => void;
  onCountdown?: (seconds: number) => void;
  onComplete?: () => void;
  onBeep?: () => void;
  onPreparationStart?: () => void;
}

export const useTrainingTimer = ({
  steps,
  onPhaseChange,
  onCountdown,
  onComplete,
  onBeep,
  onPreparationStart,
}: UseTrainingTimerProps) => {
  const [state, setState] = useState<TimerState>({
    currentStepIndex: 0,
    secondsRemaining: steps.length > 0 ? steps[0].durationSeconds : 0,
    isPaused: false,
    isRunning: false,
    isCompleted: false,
    isPreparation: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const announcedRef = useRef<Set<string>>(new Set());

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  }, []);

  const start = useCallback(() => {
    if (steps.length === 0) return;
    announcedRef.current.clear();
    // Enter preparation phase
    setState({
      currentStepIndex: 0,
      secondsRemaining: PREPARATION_SECONDS,
      isPaused: false,
      isRunning: true,
      isCompleted: false,
      isPreparation: true,
    });
    onPreparationStart?.();
    requestWakeLock();
  }, [steps, onPreparationStart, requestWakeLock]);

  const pause = useCallback(() => {
    setState(s => ({ ...s, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState(s => ({ ...s, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    releaseWakeLock();
    setState({
      currentStepIndex: 0,
      secondsRemaining: steps.length > 0 ? steps[0].durationSeconds : 0,
      isPaused: false,
      isRunning: false,
      isCompleted: false,
      isPreparation: false,
    });
  }, [clearTimer, releaseWakeLock, steps]);

  // Determine which countdown thresholds to use based on phase duration
  const getCountdownThresholds = useCallback((phaseDuration: number): number[] => {
    if (phaseDuration > 60) return [30, 20, 10, 5, 3, 2, 1];
    if (phaseDuration > 30) return [20, 10, 5, 3, 2, 1];
    return [10, 5, 3, 2, 1];
  }, []);

  useEffect(() => {
    if (!state.isRunning || state.isPaused || state.isCompleted) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.isPaused || !prev.isRunning) return prev;

        const newRemaining = prev.secondsRemaining - 1;

        // Handle preparation phase countdown
        if (prev.isPreparation) {
          if (newRemaining <= 3 && newRemaining >= 1) {
            const key = `prep-${newRemaining}`;
            if (!announcedRef.current.has(key)) {
              onCountdown?.(newRemaining);
              announcedRef.current.add(key);
            }
          }

          if (newRemaining <= 0) {
            // Transition to first real step
            const firstStep = steps[0];
            if (firstStep) {
              onPhaseChange?.(firstStep);
              onBeep?.();
            }
            return {
              ...prev,
              isPreparation: false,
              currentStepIndex: 0,
              secondsRemaining: firstStep?.durationSeconds ?? 0,
            };
          }
          return { ...prev, secondsRemaining: newRemaining };
        }

        // Normal training countdown announcements
        const currentStep = steps[prev.currentStepIndex];
        if (currentStep) {
          const thresholds = getCountdownThresholds(currentStep.durationSeconds);
          const key = `${prev.currentStepIndex}-${newRemaining}`;
          if (!announcedRef.current.has(key) && thresholds.includes(newRemaining)) {
            onCountdown?.(newRemaining);
            announcedRef.current.add(key);
          }
        }

        if (newRemaining > 0) {
          return { ...prev, secondsRemaining: newRemaining };
        }

        // Move to next step
        const nextIndex = prev.currentStepIndex + 1;
        if (nextIndex >= steps.length) {
          clearTimer();
          releaseWakeLock();
          onComplete?.();
          return { ...prev, secondsRemaining: 0, isRunning: false, isCompleted: true };
        }

        const nextStep = steps[nextIndex];
        onPhaseChange?.(nextStep);
        onBeep?.();
        return {
          ...prev,
          currentStepIndex: nextIndex,
          secondsRemaining: nextStep.durationSeconds,
        };
      });
    }, 1000);

    return () => clearTimer();
  }, [state.isRunning, state.isPaused, state.isCompleted, steps, clearTimer, releaseWakeLock, onPhaseChange, onCountdown, onComplete, onBeep, getCountdownThresholds]);

  useEffect(() => {
    return () => {
      clearTimer();
      releaseWakeLock();
    };
  }, [clearTimer, releaseWakeLock]);

  const currentStep = state.isPreparation ? null : (steps[state.currentStepIndex] || null);
  const totalRounds = steps.length > 0 ? steps[steps.length - 1].round : 0;
  const progress = state.isPreparation
    ? 1 - state.secondsRemaining / PREPARATION_SECONDS
    : currentStep
      ? 1 - state.secondsRemaining / currentStep.durationSeconds
      : 0;

  return {
    ...state,
    currentStep,
    totalRounds,
    progress,
    start,
    pause,
    resume,
    stop,
  };
};
