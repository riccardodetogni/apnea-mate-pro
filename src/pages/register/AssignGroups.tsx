import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiveRegisterDetail, useRegisterMutations } from "@/hooks/useDiveRegisters";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

const AssignGroups = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reg, isLoading } = useDiveRegisterDetail(id);
  const { assignParticipant } = useRegisterMutations(id);

  if (isLoading || !reg) {
    return (
      <AppLayout>
        <div className="py-10 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  const responsibles = reg.responsibles;
  const unassigned = reg.participants.filter((p) => !p.assigned_responsible_id);
  const byResp = new Map(responsibles.map((r) => [r.id, reg.participants.filter((p) => p.assigned_responsible_id === r.id)]));

  const cycle = (participantId: string, currentRespId: string | null) => {
    // order: null -> resp[0] -> resp[1] -> ... -> null
    const idx = currentRespId ? responsibles.findIndex((r) => r.id === currentRespId) : -1;
    const next = idx + 1;
    const nextResp = next >= responsibles.length ? null : responsibles[next].id;
    assignParticipant.mutate({ participantId, responsibleId: nextResp });
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("agTitle")}</h1>
      </header>

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        {t("agIntro")}
      </p>

      {/* Da assegnare */}
      <section className="mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("agToAssign")} ({unassigned.length})
        </h2>
        <div className="card-session !rounded-2xl !p-3 flex flex-wrap gap-2 min-h-[3rem]">
          {unassigned.length === 0 ? (
            <p className="text-xs text-[hsl(var(--card-muted))] p-1">{t("agAllAssigned")}</p>
          ) : (
            unassigned.map((p) => (
              <button
                key={p.id}
                onClick={() => cycle(p.id, null)}
                className="px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium border border-border hover:bg-secondary/80"
              >
                {p.display_name}
              </button>
            ))
          )}
        </div>
      </section>

      {responsibles.map((r, i) => {
        const list = byResp.get(r.id) ?? [];
        return (
          <section key={r.id} className="mb-3">
            <div className="card-session !rounded-2xl !p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-card-foreground text-sm">{t("agRope")} {i + 1} · {r.name}</h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary`}
                >
                  {list.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                {list.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--card-muted))] p-1">{t("agNoneAssigned")}</p>
                ) : (
                  list.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => cycle(p.id, r.id)}
                      className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/30"
                    >
                      {p.display_name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted-foreground leading-relaxed mt-2 mb-4">
        {t("agFooter")}
      </p>

      <Button
        className="w-full h-11"
        onClick={() => {
          toast.success(t("agSaved"));
          navigate(`/registro/${id}`);
        }}
      >
        {t("agSave")}
      </Button>
    </AppLayout>
  );
};

export default AssignGroups;
