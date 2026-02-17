import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { t } from "@/lib/i18n";
import { Co2TableConfig as Co2Config, generateCo2Steps, formatTime } from "@/types/training";
import { Play, ArrowLeft } from "lucide-react";

interface Co2TableConfigProps {
  onStart: (config: Co2Config) => void;
  onBack: () => void;
}

export const Co2TableConfig = ({ onStart, onBack }: Co2TableConfigProps) => {
  const [config, setConfig] = useState<Co2Config>({
    rounds: 8,
    holdSeconds: 120,
    startBreathSeconds: 120,
    decreaseStep: 15,
  });

  const steps = generateCo2Steps(config);
  const rounds: { round: number; breathe: number; hold: number }[] = [];
  for (let i = 0; i < steps.length; i += 2) {
    if (steps[i] && steps[i + 1]) {
      rounds.push({ round: steps[i].round, breathe: steps[i].durationSeconds, hold: steps[i + 1].durationSeconds });
    }
  }

  const totalSeconds = steps.reduce((acc, s) => acc + s.durationSeconds, 0);

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

      {/* Preview table */}
      <div className="card-session !rounded-xl !p-0 overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr] text-xs text-[hsl(var(--card-muted))] uppercase tracking-wider">
          <div className="p-2 text-center">#</div>
          <div className="p-2 text-center">{t("breathe")}</div>
          <div className="p-2 text-center">{t("hold")}</div>
        </div>
        {rounds.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[40px_1fr_1fr] text-sm text-[hsl(var(--card-soft))] border-t border-[hsl(var(--card-border))]">
            <div className="p-2 text-center text-[hsl(var(--card-muted))]">{row.round}</div>
            <div className="p-2 text-center font-mono">{formatTime(row.breathe)}</div>
            <div className="p-2 text-center font-mono">{formatTime(row.hold)}</div>
          </div>
        ))}
        <div className="p-2 text-center text-xs text-[hsl(var(--card-muted))] border-t border-[hsl(var(--card-border))]">
          {t("totalTime")}: {formatTime(totalSeconds)}
        </div>
      </div>

      <Button variant="primaryGradient" size="lg" className="w-full rounded-full" onClick={() => onStart(config)}>
        <Play className="w-4 h-4" />
        {t("startTraining")}
      </Button>
    </div>
  );
};
