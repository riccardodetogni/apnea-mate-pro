import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, HelpCircle, Info } from "lucide-react";
import { useDiveRegisters } from "@/hooks/useDiveRegisters";
import { StatusBadge } from "@/components/register/StatusBadge";
import { LogbookRegistroDisclaimer } from "@/components/register/LogbookRegistroDisclaimer";
import { t, getLocale } from "@/lib/i18n";

const RegisterList = () => {
  const navigate = useNavigate();
  const { data: regs = [], isLoading } = useDiveRegisters();

  return (
    <AppLayout>
      <header className="flex items-start gap-3 mb-3">
        <button
          onClick={() => navigate("/tools")}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center shrink-0"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {t("rlTitle")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t("rlSubtitle")}
          </p>
        </div>
        <button
          onClick={() => navigate("/registro/permessi")}
          className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0"
          aria-label={t("rlPermsAria")}
        >
          <HelpCircle className="w-4 h-4 text-foreground" />
        </button>
      </header>

      <div className="mb-3">
        <LogbookRegistroDisclaimer />
      </div>

      <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-xs text-foreground/80 leading-relaxed mb-4 flex gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <span>
          {t("rlNote")}
        </span>
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : regs.length === 0 ? (
        <div className="card-empty text-center py-8">
          <p className="font-medium text-foreground">{t("rlEmpty")}</p>
          <p className="text-xs mt-1">{t("rlEmptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {regs.map((r) => {
            const dateLabel = new Date(r.register_date).toLocaleDateString(getLocale(), {
              weekday: "short",
              day: "2-digit",
              month: "short",
            });
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/registro/${r.id}`)}
                className="card-session !rounded-2xl !p-4 text-left w-full"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-card-foreground text-[15px] leading-tight">{r.title}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-[hsl(var(--card-muted))] mb-2">
                  {r.spot_label ?? "—"} · {dateLabel}
                </p>
                <div className="flex items-center gap-3 text-xs text-card-foreground/80 flex-wrap">
                  <span>{r.participant_count} {t("rlParticipants")}</span>
                  <span>·</span>
                  <span>
                    {r.responsible_count} {r.responsible_count === 1 ? t("rlResponsible") : t("rlResponsibles")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default RegisterList;
