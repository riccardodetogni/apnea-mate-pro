import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { t } from "@/lib/i18n";
import { QuadraticConfig as QConfig } from "@/types/training";
import { Play, ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { useTrainingPresets } from "@/hooks/useTrainingPresets";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [hasModified, setHasModified] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const { presets, savePreset, deletePreset, updatePreset } = useTrainingPresets("quadratic");

  const cycleTime = config.inhaleSeconds + config.hold1Seconds + config.exhaleSeconds + config.hold2Seconds;
  const totalTime = cycleTime * config.rounds;
  const totalMin = Math.floor(totalTime / 60);
  const totalSec = totalTime % 60;

  const handleSliderChange = (patch: Partial<QConfig>) => {
    setConfig(c => ({ ...c, ...patch }));
    if (selectedPresetId) setHasModified(true);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset.mutate({ name: presetName.trim(), config });
    setSaveDialogOpen(false);
    setPresetName("");
  };

  const handleUpdatePreset = () => {
    if (!selectedPresetId) return;
    updatePreset.mutate({ id: selectedPresetId, config });
    setHasModified(false);
    setChoiceDialogOpen(false);
  };

  const handleBookmarkClick = () => {
    if (selectedPresetId && hasModified) {
      setChoiceDialogOpen(true);
    } else {
      setPresetName("");
      setSaveDialogOpen(true);
    }
  };

  const loadPreset = (preset: typeof presets[0]) => {
    setConfig(preset.config as QConfig);
    setSelectedPresetId(preset.id);
    setHasModified(false);
  };

  const presetSummary = (preset: typeof presets[0]) => {
    const c = preset.config as QConfig;
    return `${c.inhaleSeconds}-${c.hold1Seconds}-${c.exhaleSeconds}-${c.hold2Seconds} · ${c.rounds}r`;
  };

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-[hsl(var(--muted))] text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </button>

      <h2 className="text-xl font-bold text-foreground">{t("quadraticBreathing")}</h2>

      {/* Presets */}
      {presets.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("myPresets")}</div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {presets.map(p => (
                <div
                  key={p.id}
                  className={`!rounded-xl !p-3 !min-w-[140px] cursor-pointer flex-shrink-0 relative group ${
                    selectedPresetId === p.id
                      ? 'bg-gradient-to-br from-[hsl(185,57%,52%)] to-[hsl(228,80%,58%)] border border-white/30 rounded-xl'
                      : 'card-session'
                  }`}
                  onClick={() => loadPreset(p)}
                >
                  <div className="text-sm font-semibold text-white truncate pr-6">{p.name}</div>
                  <div className={`text-[10px] ${selectedPresetId === p.id ? 'text-white/70' : 'text-[hsl(var(--card-muted))]'}`}>{presetSummary(p)}</div>
                  <button
                    onClick={e => { e.stopPropagation(); deletePreset.mutate(p.id); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("inhale")}: {config.inhaleSeconds}s
          </label>
          <Slider value={[config.inhaleSeconds]} onValueChange={([v]) => handleSliderChange({ inhaleSeconds: v })} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("hold")} 1: {config.hold1Seconds}s
          </label>
          <Slider value={[config.hold1Seconds]} onValueChange={([v]) => handleSliderChange({ hold1Seconds: v })} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("exhale")}: {config.exhaleSeconds}s
          </label>
          <Slider value={[config.exhaleSeconds]} onValueChange={([v]) => handleSliderChange({ exhaleSeconds: v })} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("hold")} 2: {config.hold2Seconds}s
          </label>
          <Slider value={[config.hold2Seconds]} onValueChange={([v]) => handleSliderChange({ hold2Seconds: v })} min={1} max={20} step={1} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {t("rounds")}: {config.rounds}
          </label>
          <Slider value={[config.rounds]} onValueChange={([v]) => handleSliderChange({ rounds: v })} min={1} max={30} step={1} />
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

      <div className="flex gap-3">
        <Button variant="primaryGradient" size="lg" className="flex-1 rounded-full" onClick={() => onStart(config)}>
          <Play className="w-4 h-4" />
          {t("startTraining")}
        </Button>
        <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-primary/40 text-primary hover:bg-primary/10" onClick={handleBookmarkClick}>
          <Bookmark className="w-5 h-5" />
        </Button>
      </div>

      {/* Save new preset dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("savePreset")}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("presetNamePlaceholder")}
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSavePreset()}
            autoFocus
          />
          <Button onClick={handleSavePreset} disabled={!presetName.trim() || savePreset.isPending}>
            {t("save")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Update or save as new dialog */}
      <Dialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("presetModified")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button variant="primaryGradient" onClick={handleUpdatePreset} disabled={updatePreset.isPending}>
              {t("updatePreset")}
            </Button>
            <Button variant="outline" onClick={() => { setChoiceDialogOpen(false); setPresetName(""); setSaveDialogOpen(true); }}>
              {t("saveAsNew")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
