import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { Co2TableConfig as Co2Config, generateCo2Steps, formatTime } from "@/types/training";
import { Play, ArrowLeft, Pencil, Check } from "lucide-react";

interface Co2TableConfigProps {
  onStart: (config: Co2Config, customSteps?: { phase: "breathe" | "hold"; durationSeconds: number; round: number }[]) => void;
  onBack: () => void;
}

interface ManualRow {
  breathe: number;
  hold: number;
}

export const Co2TableConfig = ({ onStart, onBack }: Co2TableConfigProps) => {
  const [config, setConfig] = useState<Co2Config>({
    rounds: 8,
    holdSeconds: 120,
    startBreathSeconds: 120,
    decreaseStep: 15,
  });
  const [manualMode, setManualMode] = useState(false);
  const [manualRows, setManualRows] = useState<ManualRow[] | null>(null);

  // Compute rows from config
  const computeRows = (): ManualRow[] => {
    const rows: ManualRow[] = [];
    for (let i = 0; i < config.rounds; i++) {
      const breathTime = Math.max(15, config.startBreathSeconds - i * config.decreaseStep);
      rows.push({ breathe: breathTime, hold: config.holdSeconds });
    }
    return rows;
  };

  const activeRows = manualRows ?? computeRows();

  const totalSeconds = activeRows.reduce((acc, r) => acc + r.breathe + r.hold, 0);

  const handleEnableManual = () => {
    if (!manualMode) {
      setManualRows(computeRows());
    }
    setManualMode(true);
  };

  const handleDisableManual = () => {
    setManualMode(false);
    setManualRows(null);
  };

  const updateManualRow = (idx: number, field: "breathe" | "hold", value: string) => {
    if (!manualRows) return;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    const updated = [...manualRows];
    updated[idx] = { ...updated[idx], [field]: num };
    setManualRows(updated);
  };

  const handleStart = () => {
    if (manualMode && manualRows) {
      const steps = manualRows.flatMap((row, i) => [
        { phase: "breathe" as const, durationSeconds: row.breathe, round: i + 1 },
        { phase: "hold" as const, durationSeconds: row.hold, round: i + 1 },
      ]);
      onStart(config, steps);
    } else {
      onStart(config);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-[hsl(var(--muted))] text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </button>

      <h2 className="text-xl font-bold text-foreground">{t("co2Table")}</h2>

      {!manualMode && (
        <div className="space-y-5">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              {t("rounds")}: {config.rounds}
            </label>
            <Slider value={[config.rounds]} onValueChange={([v]) => setConfig(c => ({ ...c, rounds: v }))} min={4} max={12} step={1} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              {t("holdTime")}: {formatTime(config.holdSeconds)}
            </label>
            <Slider value={[config.holdSeconds]} onValueChange={([v]) => setConfig(c => ({ ...c, holdSeconds: v }))} min={30} max={300} step={15} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              {t("breathTime")}: {formatTime(config.startBreathSeconds)}
            </label>
            <Slider value={[config.startBreathSeconds]} onValueChange={([v]) => setConfig(c => ({ ...c, startBreathSeconds: v }))} min={30} max={300} step={15} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              {t("decreaseStep")}: {config.decreaseStep}s
            </label>
            <Slider value={[config.decreaseStep]} onValueChange={([v]) => setConfig(c => ({ ...c, decreaseStep: v }))} min={5} max={30} step={5} />
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className="card-session !rounded-xl !p-0 overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr_auto] text-xs text-[hsl(var(--card-muted))] uppercase tracking-wider">
          <div className="p-2 text-center">#</div>
          <div className="p-2 text-center">{t("breathe")}</div>
          <div className="p-2 text-center">{t("hold")}</div>
          <div className="p-2 w-10">
            {!manualMode ? (
              <button onClick={handleEnableManual} className="p-1 rounded hover:bg-accent/10">
                <Pencil className="w-3.5 h-3.5 text-[hsl(var(--card-muted))]" />
              </button>
            ) : (
              <button onClick={handleDisableManual} className="p-1 rounded hover:bg-accent/10">
                <Check className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
          </div>
        </div>
        {activeRows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[40px_1fr_1fr_auto] text-sm text-[hsl(var(--card-soft))] border-t border-[hsl(var(--card-border))]">
            <div className="p-2 text-center text-[hsl(var(--card-muted))]">{idx + 1}</div>
            <div className="p-2 text-center font-mono">
              {manualMode ? (
                <Input
                  type="number"
                  min={1}
                  value={row.breathe}
                  onChange={e => updateManualRow(idx, "breathe", e.target.value)}
                  className="h-7 text-center text-sm font-mono bg-transparent border-[hsl(var(--card-border))] w-20 mx-auto"
                />
              ) : (
                formatTime(row.breathe)
              )}
            </div>
            <div className="p-2 text-center font-mono">
              {manualMode ? (
                <Input
                  type="number"
                  min={1}
                  value={row.hold}
                  onChange={e => updateManualRow(idx, "hold", e.target.value)}
                  className="h-7 text-center text-sm font-mono bg-transparent border-[hsl(var(--card-border))] w-20 mx-auto"
                />
              ) : (
                formatTime(row.hold)
              )}
            </div>
            <div className="p-2 w-10" />
          </div>
        ))}
        <div className="p-2 text-center text-xs text-[hsl(var(--card-muted))] border-t border-[hsl(var(--card-border))]">
          {t("totalTime")}: {formatTime(totalSeconds)}
        </div>
      </div>

      <Button variant="primaryGradient" size="lg" className="w-full rounded-full" onClick={handleStart}>
        <Play className="w-4 h-4" />
        {t("startTraining")}
      </Button>
    </div>
  );
};
