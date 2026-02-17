import { useState, useRef, useCallback, useEffect } from "react";
import { TrainingStep, TimerState } from "@/types/training";

interface UseTrainingTimerProps {
  steps: TrainingStep[];
  onPhaseChange?: (step: TrainingStep) => void;
  onCountdown?: (seconds: number) => void;
  onComplete?: () => void;
  onBeep?: () => void;
}

export const useTrainingTimer = ({
  steps,
  onPhaseChange,
  onCountdown,
  onComplete,
  onBeep,
}: UseTrainingTimerProps) => {
  const [state, setState] = useState<TimerState>({
    currentStepIndex: 0,
    secondsRemaining: steps.length > 0 ? steps[0].durationSeconds : 0,
    isPaused: false,
    isRunning: false,
    isCompleted: false,
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
    setState({
      currentStepIndex: 0,
      secondsRemaining: steps[0].durationSeconds,
      isPaused: false,
      isRunning: true,
      isCompleted: false,
    });
    onPhaseChange?.(steps[0]);
    onBeep?.();
    requestWakeLock();
  }, [steps, onPhaseChange, onBeep, requestWakeLock]);

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
    });
  }, [clearTimer, releaseWakeLock, steps]);

  useEffect(() => {
    if (!state.isRunning || state.isPaused || state.isCompleted) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.isPaused || !prev.isRunning) return prev;

        const newRemaining = prev.secondsRemaining - 1;

        // Countdown announcements
        const key = `${prev.currentStepIndex}-${newRemaining}`;
        if (!announcedRef.current.has(key)) {
          if (newRemaining === 10 || (newRemaining <= 3 && newRemaining >= 1)) {
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
  }, [state.isRunning, state.isPaused, state.isCompleted, steps, clearTimer, releaseWakeLock, onPhaseChange, onCountdown, onComplete, onBeep]);

  useEffect(() => {
    return () => {
      clearTimer();
      releaseWakeLock();
    };
  }, [clearTimer, releaseWakeLock]);

  const currentStep = steps[state.currentStepIndex] || null;
  const totalRounds = steps.length > 0 ? steps[steps.length - 1].round : 0;
  const progress = currentStep
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
