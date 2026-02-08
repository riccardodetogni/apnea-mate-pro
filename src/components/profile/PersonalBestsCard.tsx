import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { PersonalBests, formatStaticTime, hasAnyPB } from "@/hooks/usePersonalBests";
import { ArrowDown, Timer, MoveRight, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface PersonalBestsCardProps {
  pbs: PersonalBests | null;
  editable?: boolean;
  onToggleVisibility?: (show: boolean) => void;
  onAddClick?: () => void;
  onEditClick?: () => void;
}

const disciplines = [
  { key: "max_depth_cwt" as const, icon: ArrowDown, unit: "m", labelIt: "CWT – Profondità", labelEn: "CWT – Depth" },
  { key: "max_static_sta" as const, icon: Timer, unit: "time", labelIt: "STA – Statica", labelEn: "STA – Static" },
  { key: "max_dynamic_dyn" as const, icon: MoveRight, unit: "m", labelIt: "DYN – Dinamica", labelEn: "DYN – Dynamic" },
  { key: "max_dynamic_dnf" as const, icon: MoveRight, unit: "m", labelIt: "DNF – Senza pinne", labelEn: "DNF – No Fins" },
  { key: "max_fim" as const, icon: ArrowDown, unit: "m", labelIt: "FIM – Immersione libera", labelEn: "FIM – Free Immersion" },
];

export const PersonalBestsCard = ({ pbs, editable = false, onToggleVisibility, onAddClick, onEditClick }: PersonalBestsCardProps) => {
  const { language } = useLanguage();
  const hasPBs = hasAnyPB(pbs);

  return (
    <div className="bg-card rounded-2xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted">{t("personalBests")}</h3>
        {editable && pbs && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{t("showOnProfile")}</span>
            <Switch
              checked={pbs.show_on_profile}
              onCheckedChange={(checked) => onToggleVisibility?.(checked)}
            />
          </div>
        )}
      </div>

      {!hasPBs ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted mb-3">{t("noPersonalBests")}</p>
          {editable && onAddClick && (
            <Button variant="outline" size="sm" onClick={onAddClick}>
              <Plus className="w-4 h-4" />
              {t("addPersonalBests")}
            </Button>
          )}
        </div>
      ) : (
        <button onClick={onEditClick} className="w-full text-left space-y-3 group">
          <div className="space-y-3">
          {disciplines.map(({ key, icon: Icon, unit, labelIt, labelEn }) => {
            const value = pbs?.[key];
            if (value === null || value === undefined) return null;

            const displayValue = unit === "time" ? formatStaticTime(value as number) : `${value}`;
            const displayUnit = unit === "time" ? "" : " m";

            return (
              <div key={key} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted">{language === "it" ? labelIt : labelEn}</p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {displayValue}{displayUnit}
                </span>
              </div>
            );
          })}
          </div>
          {editable && (
            <p className="text-xs text-primary text-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              {language === "it" ? "Tocca per modificare" : "Tap to edit"}
            </p>
          )}
        </button>
      )}
    </div>
  );
};
