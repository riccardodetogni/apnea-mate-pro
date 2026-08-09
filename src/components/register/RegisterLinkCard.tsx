import { useNavigate } from "react-router-dom";
import { ClipboardList, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { StatusBadge } from "@/components/register/StatusBadge";
import type { RegisterLink } from "@/hooks/useRegisterLink";

/**
 * Entry point from a session/event detail page to its Legge 70 register.
 * Only rendered when the register is visible to the current user (RLS
 * restricts `dive_registers` to managers/responsibles).
 */
export const RegisterLinkCard = ({ link }: { link: RegisterLink }) => {
  const navigate = useNavigate();
  const pending = Math.max(link.participant_count - link.signed_count, 0);

  return (
    <button
      onClick={() => navigate(`/registro/${link.id}`)}
      className="w-full card-session !rounded-2xl !p-4 mb-4 text-left hover:border-primary/30 transition-colors"
    >
      <div className="relative z-[1] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-card-foreground">{t("srCardTitle")}</span>
            <StatusBadge status={link.status} />
          </div>
          <p className="text-xs text-[hsl(var(--card-muted))] mt-0.5">
            {t("srCardCounts", { p: link.participant_count, s: link.signed_count })}
            {pending > 0 ? ` · ${t("srCardPending", { n: pending })}` : ""}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--card-muted))] shrink-0" />
      </div>
    </button>
  );
};
