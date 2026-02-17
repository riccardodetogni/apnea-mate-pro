import { TrainingStep, formatTime } from "@/types/training";
import { t } from "@/lib/i18n";
import { Play } from "lucide-react";

interface TrainingStepTableProps {
  steps: TrainingStep[];
  currentStepIndex: number;
  isRunning: boolean;
}

export const TrainingStepTable = ({ steps, currentStepIndex, isRunning }: TrainingStepTableProps) => {
  // Group steps by round (CO2: breathe+hold per round)
  const rounds: { round: number; breathe: number; hold: number }[] = [];
  for (let i = 0; i < steps.length; i += 2) {
    const breatheStep = steps[i];
    const holdStep = steps[i + 1];
    if (breatheStep && holdStep) {
      rounds.push({
        round: breatheStep.round,
        breathe: breatheStep.durationSeconds,
        hold: holdStep.durationSeconds,
      });
    }
  }

  const currentRound = steps[currentStepIndex]?.round ?? -1;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[hsl(var(--card-border))]">
      <div className="grid grid-cols-[40px_1fr_1fr] text-xs text-[hsl(var(--card-muted))] uppercase tracking-wider">
        <div className="p-2 text-center">#</div>
        <div className="p-2 text-center">{t("breathe")}</div>
        <div className="p-2 text-center">{t("hold")}</div>
      </div>
      {rounds.map((row, idx) => {
        const isActive = isRunning && row.round === currentRound;
        return (
          <div
            key={idx}
            className={`grid grid-cols-[40px_1fr_1fr] text-sm transition-colors ${
              isActive
                ? "bg-primary/20 text-card-foreground"
                : "text-[hsl(var(--card-soft))]"
            }`}
          >
            <div className="p-2 text-center flex items-center justify-center">
              {isActive ? (
                <Play className="w-3 h-3 text-primary fill-primary" />
              ) : (
                <span className="text-[hsl(var(--card-muted))]">{row.round}</span>
              )}
            </div>
            <div className="p-2 text-center font-mono">{formatTime(row.breathe)}</div>
            <div className="p-2 text-center font-mono">{formatTime(row.hold)}</div>
          </div>
        );
      })}
    </div>
  );
};
