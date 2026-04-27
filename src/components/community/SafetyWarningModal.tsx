import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";

interface SafetyWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionTitle: string;
  sessionLevel: string;
  userCertified: boolean;
  loading?: boolean;
}

export const SafetyWarningModal = ({
  open,
  onClose,
  onConfirm,
  sessionTitle,
  sessionLevel,
  userCertified,
  loading = false,
}: SafetyWarningModalProps) => {
  const isHighRisk = sessionLevel === "intermediate" || sessionLevel === "advanced";
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[360px] rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <DialogTitle className="text-center">
            {isHighRisk && !userCertified 
              ? t("safetyExpertTitle")
              : t("safetyTitle")
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            {isHighRisk && !userCertified ? (
              <>
                <span className="font-semibold text-foreground">{sessionTitle}</span> {t("safetyExpertSentence").replace("{level}", sessionLevel === "intermediate" ? t("safetyLevelIntermediate") : t("safetyLevelAdvanced"))}
                <br /><br />
                {t("safetyExpertAdvice")}
              </>
            ) : (
              <>
                {t("safetyAboutToJoin")} <span className="font-semibold text-foreground">{sessionTitle}</span>.
                <br /><br />
                {t("safetyMessage")}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-3 rounded-xl bg-secondary border border-border text-xs text-muted">
          {t("safetyDisclaimer")}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="primaryGradient"
            className="w-full"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("safetyJoining") : t("safetyConfirmJoin")}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
