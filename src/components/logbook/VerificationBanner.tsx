import { t } from "@/lib/i18n";
import { CheckCircle2, Star, AlertCircle, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiveLog } from "@/hooks/useDiveLogs";
import { getBadgeState } from "./VerificationBadge";

interface Props {
  log: DiveLog;
  onRequestSignature?: () => void;
  signatureMethod?: string | null;
  /** The viewer manages the register this log came from: no point asking someone else. */
  selfManaged?: boolean;
}

export const VerificationBanner = ({ log, onRequestSignature, signatureMethod, selfManaged }: Props) => {
  const state = getBadgeState(log);


  if (state === "verified") {
    const isAutofirma = signatureMethod === "autofirma";
    return (
      <div className="rounded-2xl bg-[hsl(var(--success-light))] border border-[hsl(var(--success))]/30 p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--success))] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-semibold text-[hsl(var(--success-foreground))]">
            {isAutofirma ? t("verAutofirmata") : t("verVerified")}
          </p>
          <div className="text-[hsl(var(--success-foreground))]/85 text-xs mt-0.5">
            {isAutofirma
              ? t("verAutofirmaDesc")
              : (<>{t("verSignedByPrefix")} <strong>{log.instructor_label ?? t("rqDefaultInstructor")}</strong>{log.center_label ? <> · {log.center_label}</> : null}</>)}
          </div>
        </div>
      </div>
    );
  }

  if (state === "free") {
    return (
      <div className="rounded-2xl bg-secondary/70 border border-border p-3 flex items-start gap-3">
        <Star className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          {t("verFreeBody")}
        </p>
      </div>
    );
  }

  if (selfManaged) {
    return (
      <div className="rounded-2xl bg-secondary/70 border border-border p-3 flex items-start gap-3">
        <PenSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t("verNotSignedYet")}</p>
          <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">
            {t("verSelfManagedBody")}
          </p>
        </div>
      </div>
    );
  }

  return (

    <div className="rounded-2xl bg-[hsl(var(--warning-light))] border border-[hsl(var(--warning))]/30 p-3 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-[hsl(var(--warning-foreground))] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[hsl(var(--warning-foreground))]">{t("verUnverified")}</p>
        <p className="text-xs text-[hsl(var(--warning-foreground))]/85 mt-0.5">
          {t("verUnverifiedBody")}
        </p>
        {onRequestSignature && (
          <Button size="sm" className="mt-2" onClick={onRequestSignature}>
            {t("verRequestBtn")}
          </Button>
        )}
      </div>
    </div>
  );
};
