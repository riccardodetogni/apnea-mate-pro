import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { t } from "@/lib/i18n";
import { QuadraticConfig as QConfig } from "@/types/training";
import { Play, ArrowLeft } from "lucide-react";

interface QuadraticConfigProps {
  onStart: (config: QConfig) => void;
  onBack: () => void;
}

export const QuadraticConfig = ({ onStart, onBack }: QuadraticConfigProps) => {
  const [config, setConfig] = useState<QConfig>({
    inhaleSeconds: 4,
    hold1Seconds: 4,
    exhaleSeconds: 4,
    hold2Seconds: 4,
    rounds: 10,
  });

  const cycleTime = config.inhaleSeconds + config.hold1Seconds + config.exhaleSeconds + config.hold2Seconds;
  const totalTime = cycleTime * config.rounds;
  const totalMin = Math.floor(totalTime / 60);
  const totalSec = totalTime % 60;

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-[hsl(var(--muted))] text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </button>

      <h2 className="text-xl font-bold text-foreground">{t("quadraticBreathing")}</h2>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("inhale")}: {config.inhaleSeconds}s
          </label>
          <Slider value={[config.inhaleSeconds]} onValueChange={([v]) => setConfig(c => ({ ...c, inhaleSeconds: v }))} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("hold")} 1: {config.hold1Seconds}s
          </label>
          <Slider value={[config.hold1Seconds]} onValueChange={([v]) => setConfig(c => ({ ...c, hold1Seconds: v }))} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("exhale")}: {config.exhaleSeconds}s
          </label>
          <Slider value={[config.exhaleSeconds]} onValueChange={([v]) => setConfig(c => ({ ...c, exhaleSeconds: v }))} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("hold")} 2: {config.hold2Seconds}s
          </label>
          <Slider value={[config.hold2Seconds]} onValueChange={([v]) => setConfig(c => ({ ...c, hold2Seconds: v }))} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("rounds")}: {config.rounds}
          </label>
          <Slider value={[config.rounds]} onValueChange={([v]) => setConfig(c => ({ ...c, rounds: v }))} min={1} max={30} step={1} />
        </div>
      </div>

      {/* Cycle preview */}
      <div className="card-session !rounded-xl !p-4">
        <div className="text-xs text-[hsl(var(--card-muted))] uppercase tracking-wider mb-3">{t("cyclePreview")}</div>
        <div className="flex items-center justify-between gap-2">
          {[
            { label: t("inhale"), value: config.inhaleSeconds, color: "text-primary" },
            { label: t("hold"), value: config.hold1Seconds, color: "text-[hsl(38,92%,50%)]" },
            { label: t("exhale"), value: config.exhaleSeconds, color: "text-[hsl(142,71%,45%)]" },
            { label: t("hold"), value: config.hold2Seconds, color: "text-[hsl(38,92%,50%)]" },
          ].map((item, idx) => (
            <div key={idx} className="text-center flex-1">
              <div className={`text-lg font-bold font-mono ${item.color}`}>{item.value}s</div>
              <div className="text-[10px] text-[hsl(var(--card-muted))] uppercase">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-xs text-[hsl(var(--card-muted))]">
          {t("totalTime")}: {totalMin}:{totalSec.toString().padStart(2, "0")} · {config.rounds} {t("rounds").toLowerCase()}
        </div>
      </div>

      <Button variant="primaryGradient" size="lg" className="w-full rounded-full" onClick={() => onStart(config)}>
        <Play className="w-4 h-4" />
        {t("startTraining")}
      </Button>
    </div>
  );
};
