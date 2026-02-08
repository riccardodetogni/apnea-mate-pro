import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { PersonalBests, formatStaticTime, parseStaticTime } from "@/hooks/usePersonalBests";
import { ArrowDown, Timer, MoveRight, Loader2, Save } from "lucide-react";

interface PersonalBestsFormProps {
  personalBests: PersonalBests | null;
  onSave: (values: Partial<Omit<PersonalBests, "id" | "user_id">>) => Promise<{ error: any }>;
  compact?: boolean; // for onboarding
}

const fields = [
  { key: "max_depth_cwt", icon: ArrowDown, unit: "m", labelIt: "CWT – Profondità max", labelEn: "CWT – Max depth", placeholderIt: "es. 35", placeholderEn: "e.g. 35" },
  { key: "max_static_sta", icon: Timer, unit: "time", labelIt: "STA – Statica max", labelEn: "STA – Max static hold", placeholderIt: "es. 3:30", placeholderEn: "e.g. 3:30" },
  { key: "max_dynamic_dyn", icon: MoveRight, unit: "m", labelIt: "DYN – Dinamica max", labelEn: "DYN – Max dynamic", placeholderIt: "es. 75", placeholderEn: "e.g. 75" },
  { key: "max_dynamic_dnf", icon: MoveRight, unit: "m", labelIt: "DNF – Senza pinne max", labelEn: "DNF – Max no-fins", placeholderIt: "es. 50", placeholderEn: "e.g. 50" },
  { key: "max_fim", icon: ArrowDown, unit: "m", labelIt: "FIM – Immersione libera max", labelEn: "FIM – Max free immersion", placeholderIt: "es. 30", placeholderEn: "e.g. 30" },
] as const;

export const PersonalBestsForm = ({ personalBests, onSave, compact = false }: PersonalBestsFormProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(personalBests?.show_on_profile ?? true);

  const [values, setValues] = useState<Record<string, string>>({
    max_depth_cwt: personalBests?.max_depth_cwt?.toString() || "",
    max_static_sta: personalBests?.max_static_sta ? formatStaticTime(personalBests.max_static_sta) : "",
    max_dynamic_dyn: personalBests?.max_dynamic_dyn?.toString() || "",
    max_dynamic_dnf: personalBests?.max_dynamic_dnf?.toString() || "",
    max_fim: personalBests?.max_fim?.toString() || "",
  });

  useEffect(() => {
    if (personalBests) {
      setValues({
        max_depth_cwt: personalBests.max_depth_cwt?.toString() || "",
        max_static_sta: personalBests.max_static_sta ? formatStaticTime(personalBests.max_static_sta) : "",
        max_dynamic_dyn: personalBests.max_dynamic_dyn?.toString() || "",
        max_dynamic_dnf: personalBests.max_dynamic_dnf?.toString() || "",
        max_fim: personalBests.max_fim?.toString() || "",
      });
      setShowOnProfile(personalBests.show_on_profile);
    }
  }, [personalBests]);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);

    const payload: any = {
      max_depth_cwt: values.max_depth_cwt ? parseFloat(values.max_depth_cwt) : null,
      max_static_sta: parseStaticTime(values.max_static_sta),
      max_dynamic_dyn: values.max_dynamic_dyn ? parseFloat(values.max_dynamic_dyn) : null,
      max_dynamic_dnf: values.max_dynamic_dnf ? parseFloat(values.max_dynamic_dnf) : null,
      max_fim: values.max_fim ? parseFloat(values.max_fim) : null,
      show_on_profile: showOnProfile,
    };

    const { error } = await onSave(payload);
    setSaving(false);

    if (error) {
      toast({
        title: language === "it" ? "Errore" : "Error",
        description: language === "it" ? "Impossibile salvare i record" : "Failed to save records",
        variant: "destructive",
      });
    } else if (!compact) {
      toast({
        title: language === "it" ? "Salvato" : "Saved",
        description: language === "it" ? "Record personali aggiornati" : "Personal bests updated",
      });
    }
  };

  return (
    <div className="space-y-4">
      {fields.map(({ key, icon: Icon, unit, labelIt, labelEn, placeholderIt, placeholderEn }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key} className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {language === "it" ? labelIt : labelEn}
          </Label>
          <div className="relative">
            <Input
              id={key}
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={language === "it" ? placeholderIt : placeholderEn}
              inputMode={unit === "time" ? "text" : "decimal"}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unit === "time" ? "mm:ss" : "m"}
            </span>
          </div>
        </div>
      ))}

      {!compact && (
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm text-foreground">{t("showOnProfile")}</p>
            <p className="text-xs text-muted">
              {language === "it"
                ? "Visibile sul tuo profilo pubblico"
                : "Visible on your public profile"}
            </p>
          </div>
          <Switch checked={showOnProfile} onCheckedChange={setShowOnProfile} />
        </div>
      )}

      <Button
        className="w-full gap-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {compact
          ? (language === "it" ? "Salva e continua" : "Save & continue")
          : (language === "it" ? "Salva record" : "Save records")}
      </Button>

      {compact && (
        <p className="text-xs text-muted text-center">{t("updateLater")}</p>
      )}
    </div>
  );
};
