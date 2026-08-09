import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLibrettiAnteprima } from "@/hooks/useLibretti";
import { useSignLibrettiGroup } from "@/hooks/useSigning";
import { PasswordReauthDialog } from "@/components/logbook/PasswordReauthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";

const LibrettiAnteprima = () => {
  const { id, groupId } = useParams<{ id: string; groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useLibrettiAnteprima(id, groupId);
  const sign = useSignLibrettiGroup(id);
  const [reauthOpen, setReauthOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  const pending = data.members.filter((m) => !m.verified);
  const canSign = data.instructor_user_id === user?.id && pending.length > 0;

  const handleConfirm = async (password: string) => {
    const signed = await sign.mutateAsync({ groupId: groupId!, password });
    toast.success(
      t("laSuccess", { n: signed }),
    );
    navigate(`/registro/${id}/libretti`);
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(`/registro/${id}/libretti`)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight">{t("laTitle")}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {t("laResponsible")} {data.responsible_name}
            {data.brevetto_label ? ` · ${data.brevetto_label}` : ""}
          </p>
        </div>
      </header>

      <div className="rounded-2xl bg-secondary/60 border border-border p-3 mb-3">
        <p className="text-sm font-semibold text-foreground">{t("laBanner")}</p>
        <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
          {t("laBannerBody")}
        </p>
      </div>

      <div className="card-session !rounded-2xl !p-3 mb-4">
        {data.members.length === 0 ? (
          <p className="text-sm text-[hsl(var(--card-muted))] py-4 text-center">{t("laEmpty")}</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.members.map((m) => (
              <li key={m.participant_id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-card-foreground truncate">
                      {m.display_name}
                    </p>
                    <p className="text-xs text-[hsl(var(--card-muted))] mt-0.5">
                      {m.brevetto_label ?? t("laNoBrevetto")}
                      {m.discipline ? ` · ${m.discipline}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-card-foreground">
                      {m.reached_depth_m != null ? `${m.reached_depth_m} m` : "—"}
                    </p>
                    {m.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[hsl(var(--success-foreground))] mt-1">
                        <CheckCircle2 className="w-3 h-3" /> {t("laSigned")}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canSign ? (
        <Button className="w-full h-11" onClick={() => setReauthOpen(true)} disabled={sign.isPending}>
          {t("laSignBtn")} {pending.length} {t("laLibretti")}
        </Button>
      ) : (
        <div className="rounded-2xl border border-border bg-secondary/60 p-3 text-xs text-muted-foreground text-center">
          {pending.length === 0
            ? t("laAllSigned")
            : t("laOnlyResp")}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        {t("laFooter")}
      </p>

      <PasswordReauthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        title={t("laReauthTitle")}
        description={t("laReauthDesc", { n: pending.length })}
        confirmLabel={`${t("laSignBtn")} ${pending.length} ${t("laLibretti")}`}
        onConfirm={handleConfirm}
      />
    </AppLayout>
  );
};

export default LibrettiAnteprima;
