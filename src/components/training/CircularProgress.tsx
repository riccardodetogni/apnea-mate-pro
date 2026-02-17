import { TrainingPhase } from "@/types/training";

interface CircularProgressProps {
  progress: number; // 0 to 1
  phase: TrainingPhase;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

const phaseColors: Record<TrainingPhase, string> = {
  breathe: "hsl(228, 80%, 58%)",   // primary blue
  inhale: "hsl(228, 80%, 58%)",    // primary blue
  hold: "hsl(38, 92%, 50%)",       // warning amber
  exhale: "hsl(142, 71%, 45%)",    // success green
};

const phaseTrackColors: Record<TrainingPhase, string> = {
  breathe: "rgba(63, 102, 232, 0.15)",
  inhale: "rgba(63, 102, 232, 0.15)",
  hold: "rgba(245, 158, 11, 0.15)",
  exhale: "rgba(34, 197, 94, 0.15)",
};

export const CircularProgress = ({
  progress,
  phase,
  size = 240,
  strokeWidth = 8,
  children,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={phaseTrackColors[phase]}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={phaseColors[phase]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};
