import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FieldType = "name" | "bio" | "location" | "insurance_provider" | "freediving_since";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FieldType;
  currentValue: string;
  onSave: (value: string) => Promise<void>;
}

const fieldConfig = {
  name: {
    labelIt: "Nome",
    labelEn: "Name",
    placeholderIt: "Il tuo nome",
    placeholderEn: "Your name",
    maxLength: 100,
    required: true,
  },
  bio: {
    labelIt: "Bio",
    labelEn: "Bio",
    placeholderIt: "Racconta qualcosa di te...",
    placeholderEn: "Tell something about yourself...",
    maxLength: 300,
    required: false,
  },
  location: {
    labelIt: "Località",
    labelEn: "Location",
    placeholderIt: "Es. Roma, Italia",
    placeholderEn: "E.g. Rome, Italy",
    maxLength: 150,
    required: false,
  },
  insurance_provider: {
    labelIt: "Ente assicurativo",
    labelEn: "Insurance provider",
    placeholderIt: "es. DAN, FIAS, ecc.",
    placeholderEn: "e.g. DAN, FIAS, etc.",
    maxLength: 100,
    required: false,
  },
  freediving_since: {
    labelIt: "Anno di inizio apnea",
    labelEn: "Year you started freediving",
    placeholderIt: "es. 2018",
    placeholderEn: "e.g. 2018",
    maxLength: 4,
    required: false,
  },
};

export const ProfileEditDialog = ({
  open,
  onOpenChange,
  field,
  currentValue,
  onSave,
}: ProfileEditDialogProps) => {
  const { language } = useLanguage();
  const [value, setValue] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  const config = fieldConfig[field];

  useEffect(() => {
    if (open) {
      setValue(currentValue);
    }
  }, [open, currentValue]);

  const handleSave = async () => {
    if (config.required && !value.trim()) return;
    if (field === "freediving_since" && value.trim()) {
      const yr = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yr) || yr < 1950 || yr > currentYear) return;
    }
    setSaving(true);
    await onSave(value.trim());
    setSaving(false);
    onOpenChange(false);
  };

  const title = language === "it"
    ? `Modifica ${config.labelIt.toLowerCase()}`
    : `Edit ${config.labelEn.toLowerCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Label>{language === "it" ? config.labelIt : config.labelEn}</Label>

          {field === "bio" ? (
            <div>
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={language === "it" ? config.placeholderIt : config.placeholderEn}
                maxLength={config.maxLength}
                className="resize-none h-28"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {value.length}/{config.maxLength}
              </p>
            </div>
          ) : (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={language === "it" ? config.placeholderIt : config.placeholderEn}
              maxLength={config.maxLength}
              type={field === "freediving_since" ? "number" : "text"}
              min={field === "freediving_since" ? 1950 : undefined}
              max={field === "freediving_since" ? new Date().getFullYear() : undefined}
              autoFocus
            />
          )}

          {field === "freediving_since" && value && !isNaN(parseInt(value, 10)) && (
            <p className="text-xs text-muted-foreground">
              {Math.max(0, new Date().getFullYear() - parseInt(value, 10))}{" "}
              {language === "it" ? "anni di esperienza" : "years of experience"}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {language === "it" ? "Annulla" : "Cancel"}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={saving || (config.required && !value.trim())}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {language === "it" ? "Salva" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
