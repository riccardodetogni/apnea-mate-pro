import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { t } from "@/lib/i18n";
import { Co2TableConfig as Co2Config, formatTime } from "@/types/training";
import { Play, ArrowLeft } from "lucide-react";

interface Co2TableConfigProps {
  onStart: (config: Co2Config, customSteps?: { phase: "breathe" | "hold"; durationSeconds: number; round: number }[]) => void;
  onBack: () => void;
}

interface RowData {
  breathe: number;
  hold: number;
}

const computeRows = (config: Co2Config): RowData[] => {
  const rows: RowData[] = [];
  for (let i = 0; i < config.rounds; i++) {
    const breathTime = Math.max(15, config.startBreathSeconds - i * config.decreaseStep);
    rows.push({ breathe: breathTime, hold: config.holdSeconds });
  }
  return rows;
};

export const Co2TableConfig = ({ onStart, onBack }: Co2TableConfigProps) => {
  const [config, setConfig] = useState<Co2Config>({
    rounds: 8,
    holdSeconds: 120,
    startBreathSeconds: 120,
    decreaseStep: 15,
  });
  // null = generated from sliders, array = user has manually edited at least one cell
  const [customRows, setCustomRows] = useState<RowData[] | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; field: "breathe" | "hold" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rows = customRows ?? computeRows(config);
  const totalSeconds = rows.reduce((acc, r) => acc + r.breathe + r.hold, 0);

  // When any slider changes, reset custom rows
  const updateConfig = (patch: Partial<Co2Config>) => {
    setConfig(c => ({ ...c, ...patch }));
    setCustomRows(null);
    setEditingCell(null);
  };

  const handleCellClick = (rowIdx: number, field: "breathe" | "hold") => {
    // Initialize custom rows from current computed rows if not yet customized
    if (!customRows) {
      setCustomRows(computeRows(config));
    }
    setEditingCell({ row: rowIdx, field });
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleCellBlur = (rowIdx: number, field: "breathe" | "hold", value: string) => {
    setEditingCell(null);
    const parts = value.split(":").map(s => parseInt(s.trim(), 10));
    let seconds: number;
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      seconds = parts[0] * 60 + parts[1];
    } else {
      const num = parseInt(value, 10);
      if (isNaN(num)) return;
      seconds = num;
    }
    if (seconds < 1) seconds = 1;

    setCustomRows(prev => {
      const base = prev ?? computeRows(config);
      const updated = [...base];
      updated[rowIdx] = { ...updated[rowIdx], [field]: seconds };
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, field: "breathe" | "hold") => {
    if (e.key === "Enter") {
      handleCellBlur(rowIdx, field, (e.target as HTMLInputElement).value);
    }
  };

  const handleStart = () => {
    const finalRows = customRows ?? computeRows(config);
    const steps = finalRows.flatMap((row, i) => [
      { phase: "breathe" as const, durationSeconds: row.breathe, round: i + 1 },
      { phase: "hold" as const, durationSeconds: row.hold, round: i + 1 },
    ]);
    onStart(config, steps);
  };

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-[hsl(var(--muted))] text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </button>

      <h2 className="text-xl font-bold text-foreground">{t("co2Table")}</h2>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("rounds")}: {config.rounds}
          </label>
          <Slider value={[config.rounds]} onValueChange={([v]) => updateConfig({ rounds: v })} min={4} max={12} step={1} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("holdTime")}: {formatTime(config.holdSeconds)}
          </label>
          <Slider value={[config.holdSeconds]} onValueChange={([v]) => updateConfig({ holdSeconds: v })} min={30} max={300} step={15} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("breathTime")}: {formatTime(config.startBreathSeconds)}
          </label>
          <Slider value={[config.startBreathSeconds]} onValueChange={([v]) => updateConfig({ startBreathSeconds: v })} min={30} max={300} step={15} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("decreaseStep")}: {config.decreaseStep}s
          </label>
          <Slider value={[config.decreaseStep]} onValueChange={([v]) => updateConfig({ decreaseStep: v })} min={5} max={30} step={5} />
        </div>
      </div>

      {/* Preview table — tap any cell to edit */}
      <div className="card-session !rounded-xl !p-0 overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr] text-xs text-[hsl(var(--card-muted))] uppercase tracking-wider">
          <div className="p-2 text-center">#</div>
          <div className="p-2 text-center">{t("breathe")}</div>
          <div className="p-2 text-center">{t("hold")}</div>
        </div>
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[40px_1fr_1fr] text-sm text-[hsl(var(--card-soft))] border-t border-[hsl(var(--card-border))]">
            <div className="p-2 text-center text-[hsl(var(--card-muted))]">{idx + 1}</div>
            {(["breathe", "hold"] as const).map(field => (
              <div key={field} className="p-2 text-center font-mono">
                {editingCell?.row === idx && editingCell?.field === field ? (
                  <input
                    ref={inputRef}
                    autoFocus
                    defaultValue={formatTime(row[field])}
                    onBlur={e => handleCellBlur(idx, field, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, idx, field)}
                    className="w-16 text-center font-mono text-sm bg-transparent border-b border-primary outline-none text-foreground"
                  />
                ) : (
                  <button
                    onClick={() => handleCellClick(idx, field)}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {formatTime(row[field])}
                  </button>
                )}
              </div>
            ))}
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
