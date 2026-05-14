import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface CreateDisclaimerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CreateDisclaimerModal = ({ open, onClose, onConfirm }: CreateDisclaimerModalProps) => {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (open) setAccepted(false);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[92vh] flex flex-col gap-0"
      >
        <SheetHeader className="px-5 pt-6 pb-3">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-warning/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-warning" />
          </div>
          <SheetTitle className="text-center">{t("createDisclaimerTitle")}</SheetTitle>
        </SheetHeader>

        <div className="px-5 py-3 overflow-y-auto flex-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-xs leading-relaxed text-foreground">
              {t("createDisclaimerCheckbox")}
            </span>
          </label>
        </div>

        <div className="px-5 pt-3 pb-6 flex flex-col gap-2 border-t border-border">
          <Button
            variant="primaryGradient"
            className="w-full"
            disabled={!accepted}
            onClick={onConfirm}
          >
            {t("createDisclaimerContinue")}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t("createDisclaimerCancel")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};