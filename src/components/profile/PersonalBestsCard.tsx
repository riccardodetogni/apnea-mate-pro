import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PersonalBests, formatStaticTime, parseStaticTime, hasAnyPB } from "@/hooks/usePersonalBests";
import { ArrowDown, Timer, MoveRight, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface PersonalBestsCardProps {
  pbs: PersonalBests | null;
  editable?: boolean;
  onToggleVisibility?: (show: boolean) => void;
  onSaveField?: (key: string, value: number | null) => Promise<void>;
}

const disciplines = [
  { key: "max_depth_cwt" as const, icon: ArrowDown, unit: "m", labelIt: "CWT – Profondità", labelEn: "CWT – Depth", placeholderIt: "es. 35", placeholderEn: "e.g. 35" },
  { key: "max_static_sta" as const, icon: Timer, unit: "time", labelIt: "STA – Statica", labelEn: "STA – Static", placeholderIt: "es. 3:30", placeholderEn: "e.g. 3:30" },
  { key: "max_dynamic_dyn" as const, icon: MoveRight, unit: "m", labelIt: "DYN – Dinamica", labelEn: "DYN – Dynamic", placeholderIt: "es. 75", placeholderEn: "e.g. 75" },
  { key: "max_dynamic_dnf" as const, icon: MoveRight, unit: "m", labelIt: "DNF – Senza pinne", labelEn: "DNF – No Fins", placeholderIt: "es. 50", placeholderEn: "e.g. 50" },
  { key: "max_fim" as const, icon: ArrowDown, unit: "m", labelIt: "FIM – Immersione libera", labelEn: "FIM – Free Immersion", placeholderIt: "es. 30", placeholderEn: "e.g. 30" },
];

export const PersonalBestsCard = ({ pbs, editable = false, onToggleVisibility, onSaveField }: PersonalBestsCardProps) => {
  const { language } = useLanguage();
  const hasPBs = hasAnyPB(pbs);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = (key: string, unit: string) => {
    const currentValue = pbs?.[key as keyof PersonalBests];
    if (unit === "time" && typeof currentValue === "number") {
      setEditValue(formatStaticTime(currentValue));
    } else if (currentValue !== null && currentValue !== undefined) {
      setEditValue(String(currentValue));
    } else {
      setEditValue("");
    }
    setEditingKey(key);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const confirmEditing = async (key: string, unit: string) => {
    if (!onSaveField) return;
    setSaving(true);
    let numericValue: number | null = null;
    if (editValue.trim()) {
      if (unit === "time") {
        numericValue = parseStaticTime(editValue);
      } else {
        numericValue = parseFloat(editValue);
        if (isNaN(numericValue)) numericValue = null;
      }
    }
    await onSaveField(key, numericValue);
    setSaving(false);
    setEditingKey(null);
    setEditValue("");
  };

  return (
    <div className="bg-card rounded-2xl border border-white/8 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/55">{t("personalBests")}</h3>
        {editable && pbs && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/55">{t("showOnProfile")}</span>
            <Switch
              checked={pbs.show_on_profile}
              onCheckedChange={(checked) => onToggleVisibility?.(checked)}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {disciplines.map(({ key, icon: Icon, unit, labelIt, labelEn, placeholderIt, placeholderEn }) => {
          const value = pbs?.[key as keyof PersonalBests] as number | null | undefined;
          const hasValue = value !== null && value !== undefined;
          const isEditing = editingKey === key;

          const displayValue = hasValue
            ? unit === "time" ? formatStaticTime(value as number) : `${value}`
            : null;
          const displayUnit = unit === "time" ? "" : " m";

          // Editing mode: show input inline
          if (isEditing && editable) {
            return (
              <div key={key} className="flex items-center gap-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={language === "it" ? placeholderIt : placeholderEn}
                  inputMode={unit === "time" ? "text" : "decimal"}
                  className="h-8 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEditing(key, unit);
                    if (e.key === "Escape") cancelEditing();
                  }}
                />
                <span className="text-xs text-white/55 w-8 text-center">
                  {unit === "time" ? "m:ss" : "m"}
                </span>
                <button
                  onClick={() => confirmEditing(key, unit)}
                  disabled={saving}
                  className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
                <button
                  onClick={cancelEditing}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-white/55" />
                </button>
              </div>
            );
          }

          // Display mode: show value or "add" prompt
          if (hasValue) {
            return (
              <button
                key={key}
                onClick={editable ? () => startEditing(key, unit) : undefined}
                disabled={!editable}
                className="flex items-center gap-3 py-1.5 w-full text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/55">{language === "it" ? labelIt : labelEn}</p>
                </div>
                <span className="text-sm font-semibold text-card-foreground tabular-nums">
                  {displayValue}{displayUnit}
                </span>
              </button>
            );
          }

          // No value and editable: show "add" row
          if (editable) {
            return (
              <button
                key={key}
                onClick={() => startEditing(key, unit)}
                className="flex items-center gap-3 py-1.5 w-full text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/55" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/55">{language === "it" ? labelIt : labelEn}</p>
                </div>
                <span className="text-xs text-primary flex items-center gap-0.5">
                  <Plus className="w-3 h-3" />
                  {language === "it" ? "Aggiungi" : "Add"}
                </span>
              </button>
            );
          }

          // No value and not editable: don't show
          return null;
        })}
      </div>
    </div>
  );
};
