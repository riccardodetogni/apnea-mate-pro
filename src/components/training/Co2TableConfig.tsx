import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { t } from "@/lib/i18n";
import { Co2TableConfig as Co2Config, formatTime } from "@/types/training";
import { Play, ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { useTrainingPresets } from "@/hooks/useTrainingPresets";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  const [customRows, setCustomRows] = useState<RowData[] | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; field: "breathe" | "hold" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [hasModified, setHasModified] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const { presets, savePreset, deletePreset, updatePreset } = useTrainingPresets("co2");

  const rows = customRows ?? computeRows(config);
  const totalSeconds = rows.reduce((acc, r) => acc + r.breathe + r.hold, 0);

  const updateConfig = (patch: Partial<Co2Config>) => {
    setConfig(c => ({ ...c, ...patch }));
    setCustomRows(null);
    setEditingCell(null);
    if (selectedPresetId) setHasModified(true);
  };

  const handleCellClick = (rowIdx: number, field: "breathe" | "hold") => {
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

    if (selectedPresetId) setHasModified(true);
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

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset.mutate({
      name: presetName.trim(),
      config,
      customRows: customRows ?? null,
    });
    setSaveDialogOpen(false);
    setPresetName("");
  };

  const handleUpdatePreset = () => {
    if (!selectedPresetId) return;
    updatePreset.mutate({
      id: selectedPresetId,
      config,
      customRows: customRows ?? null,
    });
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
    const c = preset.config as Co2Config;
    setConfig(c);
    setCustomRows(preset.custom_rows ?? null);
    setEditingCell(null);
    setSelectedPresetId(preset.id);
    setHasModified(false);
  };

  const presetSummary = (preset: typeof presets[0]) => {
    const c = preset.config as Co2Config;
    return `${c.rounds}r · ${formatTime(c.holdSeconds)}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-[hsl(var(--muted))] text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </button>

      <h2 className="text-xl font-bold text-foreground">{t("co2Table")}</h2>

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

      {/* Preview table */}
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

      <div className="flex gap-3">
        <Button variant="primaryGradient" size="lg" className="flex-1 rounded-full" onClick={handleStart}>
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
