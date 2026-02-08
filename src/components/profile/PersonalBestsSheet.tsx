import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { PersonalBestsForm } from "@/components/profile/PersonalBestsForm";
import { PersonalBests } from "@/hooks/usePersonalBests";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface PersonalBestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personalBests: PersonalBests | null;
  onSave: (values: Partial<Omit<PersonalBests, "id" | "user_id">>) => Promise<{ error: any }>;
}

export const PersonalBestsSheet = ({
  open,
  onOpenChange,
  personalBests,
  onSave,
}: PersonalBestsSheetProps) => {
  const { language } = useLanguage();

  const handleSave = async (values: Partial<Omit<PersonalBests, "id" | "user_id">>) => {
    const result = await onSave(values);
    if (!result?.error) {
      onOpenChange(false);
    }
    return result;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{t("personalBests")}</SheetTitle>
          <SheetDescription>
            {language === "it"
              ? "Aggiorna i tuoi record personali"
              : "Update your personal records"}
          </SheetDescription>
        </SheetHeader>
        <PersonalBestsForm
          personalBests={personalBests}
          onSave={handleSave}
        />
      </SheetContent>
    </Sheet>
  );
};
