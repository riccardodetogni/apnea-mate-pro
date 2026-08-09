import { t } from "@/lib/i18n";
import { CheckCircle2, Star, AlertCircle } from "lucide-react";
import type { DiveLog } from "@/hooks/useDiveLogs";

export const getBadgeState = (log: Pick<DiveLog, "verification_status" | "outing_type">) => {
  if (log.verification_status === "verified") return "verified" as const;
  if (log.outing_type === "free") return "free" as const;
  return "unverified" as const;
};

export const VerificationBadge = ({ log }: { log: Pick<DiveLog, "verification_status" | "outing_type"> }) => {
  const state = getBadgeState(log);
  if (state === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--success-light))] text-[hsl(var(--success-foreground))]">
        <CheckCircle2 className="w-3.5 h-3.5" /> {t("verVerified")}
      </span>
    );
  }
  if (state === "free") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
        <Star className="w-3.5 h-3.5" /> {t("verFree")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--warning-light))] text-[hsl(var(--warning-foreground))]">
      <AlertCircle className="w-3.5 h-3.5" /> {t("verUnverified")}
    </span>
  );
};
