export type TrainingMode = "co2" | "quadratic";

export interface Co2TableConfig {
  rounds: number;
  holdSeconds: number;
  startBreathSeconds: number;
  decreaseStep: number;
}

export interface QuadraticConfig {
  inhaleSeconds: number;
  hold1Seconds: number;
  exhaleSeconds: number;
  hold2Seconds: number;
  rounds: number;
}

export type TrainingPhase = "inhale" | "hold" | "exhale" | "breathe";

export interface TrainingStep {
  phase: TrainingPhase;
  durationSeconds: number;
  round: number;
}

export interface TimerState {
  currentStepIndex: number;
  secondsRemaining: number;
  isPaused: boolean;
  isRunning: boolean;
  isCompleted: boolean;
}

export const generateCo2Steps = (config: Co2TableConfig): TrainingStep[] => {
  const steps: TrainingStep[] = [];
  for (let i = 0; i < config.rounds; i++) {
    const breathTime = Math.max(15, config.startBreathSeconds - i * config.decreaseStep);
    steps.push({ phase: "breathe", durationSeconds: breathTime, round: i + 1 });
    steps.push({ phase: "hold", durationSeconds: config.holdSeconds, round: i + 1 });
  }
  return steps;
};

export const generateQuadraticSteps = (config: QuadraticConfig): TrainingStep[] => {
  const steps: TrainingStep[] = [];
  for (let i = 0; i < config.rounds; i++) {
    steps.push({ phase: "inhale", durationSeconds: config.inhaleSeconds, round: i + 1 });
    steps.push({ phase: "hold", durationSeconds: config.hold1Seconds, round: i + 1 });
    steps.push({ phase: "exhale", durationSeconds: config.exhaleSeconds, round: i + 1 });
    steps.push({ phase: "hold", durationSeconds: config.hold2Seconds, round: i + 1 });
  }
  return steps;
};

export interface TrainingPreset {
  id: string;
  user_id: string;
  name: string;
  mode: TrainingMode;
  config: Co2TableConfig | QuadraticConfig;
  custom_rows: { breathe: number; hold: number }[] | null;
  created_at: string;
}

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
  return `0:${s.toString().padStart(2, "0")}`;
};
