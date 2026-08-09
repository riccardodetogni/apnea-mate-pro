import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, CheckCircle2, Clock, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLibrettiGroups, useUnassignedCount, type LibrettoGroup } from "@/hooks/useLibretti";
import { useDiveRegisterDetail } from "@/hooks/useDiveRegisters";
import { createNotification } from "@/lib/notifications";
import { downloadLogbookPdf } from "@/lib/logbookPdf";
import { t, getLocale } from "@/lib/i18n";

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });

const GroupCard = ({
  g,
  onSign,
  onRemind,
}: {
  g: LibrettoGroup;
  onSign: () => void;
  onRemind: () => void;
}) => {
  const fullySigned = g.signed_count >= g.participant_count && g.participant_count > 0;
  const empty = g.participant_count === 0;
  return (
    <div className="card-session !rounded-2xl !p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">{g.responsible_name}</h3>
          <p className="text-xs text-[hsl(var(--card-muted))] mt-0.5">
            {g.participant_count} {t("liLibrettiCount")}
            {g.brevetto_label ? ` · ${g.brevetto_label}` : ""}
          </p>
        </div>
        {empty ? null : fullySigned && g.last_signed_at ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-[hsl(var(--success-light))] text-[hsl(var(--success-foreground))]">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t("liSignedAt")} {timeLabel(g.last_signed_at)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-[hsl(var(--warning-light))] text-[hsl(var(--warning-foreground))]">
            <Clock className="w-3.5 h-3.5" /> {t("liWaiting")}
          </span>
        )}
      </div>

      {empty ? (
        <p className="text-xs text-[hsl(var(--card-muted))] mt-3">{t("liNoMembers")}</p>
      ) : !fullySigned ? (
        <div className="mt-3">
          {g.is_current_user ? (
            <Button className="w-full h-10" onClick={onSign}>
              {t("liSignYourGroup")} ({g.participant_count - g.signed_count})
            </Button>
          ) : (
            <Button variant="outline" className="w-full h-10 gap-2" onClick={onRemind}>
              <Send className="w-4 h-4" /> {t("liRemind")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};

const LibrettiIndex = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reg } = useDiveRegisterDetail(id);
  const { data: groups = [], isLoading } = useLibrettiGroups(id);
  const { data: unassigned = 0 } = useUnassignedCount(id);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!id) return;
    setExporting(true);
    try {
      await downloadLogbookPdf({
        type: "libretti_all",
        id,
        filename: `libretti-${id}.pdf`,
      });
    } catch (err) {
      toast.error(t("lbExportFailed"));
      console.error("libretti pdf export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(`/registro/${id}`)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight">{t("liTitle")}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {reg?.title ?? t("liDefaultReg")} · {reg?.register_date}
          </p>
        </div>
      </header>

      <div className="rounded-2xl bg-secondary/60 border border-border p-3 mb-4">
        <p className="text-xs text-foreground/85 leading-relaxed">
          {t("liIntro")}
        </p>
      </div>

      {unassigned > 0 && (
        <div className="rounded-2xl border border-border bg-secondary/60 p-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-foreground/85">{t("liUnassigned", { n: unassigned })}</p>
          <Button size="sm" variant="outline" onClick={() => navigate(`/registro/${id}/assign`)}>
            {t("liAssignCta")}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("liEmpty")}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard
              key={g.responsible_id}
              g={g}
              onSign={() => navigate(`/registro/${id}/libretti/${g.responsible_id}`)}
              onRemind={async () => {
                const { error } = await createNotification({
                  userId: g.responsible_id,
                  type: "signature_reminder" as any,
                  title: t("liReminderTitle"),
                  message: t("liReminderMsg", { title: reg?.title ?? "" }),
                  metadata: { register_id: id, group_id: g.responsible_id } as any,
                });
                if (error) toast.error(t("liReminderFail"));
                else toast.success(t("liReminderSentTo", { name: g.responsible_name }));
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <Button
          variant="outline"
          className="w-full h-11 gap-2"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="w-4 h-4" /> {t("liExportBtn")}
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("liFooter")}
        </p>
      </div>
    </AppLayout>
  );
};

export default LibrettiIndex;
