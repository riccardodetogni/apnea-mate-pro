import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Download, PenSquare, Pencil, Compass } from "lucide-react";
import { useDiveLog, useUpdateDiveLog, useDiveLogBrevetto } from "@/hooks/useDiveLogs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useAutofirma, usePendingSignatureRequest, useSignRequestedLog } from "@/hooks/useSigning";
import { useDiveLogOrigin, useIsRegisterManager } from "@/hooks/useRegisterLink";
import { supabase } from "@/integrations/supabase/client";
import { VerificationBanner } from "@/components/logbook/VerificationBanner";
import { RequestSignatureModal } from "@/components/logbook/RequestSignatureModal";
import { PasswordReauthDialog } from "@/components/logbook/PasswordReauthDialog";
import { ConformityNote } from "@/components/logbook/ConformityNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fullName, brevettoLabel } from "@/lib/format";
import { mapEnvironmentType, t, getLocale } from "@/lib/i18n";
import { downloadLogbookPdf } from "@/lib/logbookPdf";
import { toast } from "sonner";


const MONTHS_KEYS = ["monJan", "monFeb", "monMar", "monApr", "monMay", "monJun", "monJul", "monAug", "monSep", "monOct", "monNov", "monDec"];
const DAYS_KEYS = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"];

const formatDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${t(DAYS_KEYS[d.getDay()] as any)} ${d.getDate()} ${t(MONTHS_KEYS[d.getMonth()] as any)} ${d.getFullYear()}`;
};

const durationLabel = (start: string | null, end: string | null) => {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}` : `${h}h`;
};

const Row = ({ label, value, code }: { label: string; value: React.ReactNode; code?: string }) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">
      {label} {code && <span className="text-xs">({code})</span>}
    </span>
    <span className="text-sm font-medium text-right">{value ?? "—"}</span>
  </div>
);

const DiveLogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: log, isLoading } = useDiveLog(id);
  const { data: logOrigin } = useDiveLogOrigin(id, !!log?.register_id);
  const { data: isRegisterManager } = useIsRegisterManager(log?.register_id);
  const { profile, certification, isInstructor } = useProfile();
  const { data: registerBrevetto } = useDiveLogBrevetto(id);
  const { user } = useAuth();
  const autofirma = useAutofirma();
  const { data: hasPendingRequest } = usePendingSignatureRequest(id);
  const signRequested = useSignRequestedLog();
  const [signRequestOpen, setSignRequestOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [autofirmaOpen, setAutofirmaOpen] = useState(false);
  const [sigMethod, setSigMethod] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const updateLog = useUpdateDiveLog();
  // Owner of the log who also manages its register: asking a third party makes no sense.
  const selfManaged = !!isRegisterManager && log?.user_id === user?.id;
  const [form, setForm] = useState({
    start_time: "",
    end_time: "",
    planned_depth_m: "",
    reached_depth_m: "",
    dives_count: "",
    discipline: "",
    breathing_apparatus: false,
    gas_mix: "",
    notes: "",
  });

  const openEdit = () => {
    if (!log) return;
    setForm({
      start_time: log.start_time?.slice(0, 5) ?? "",
      end_time: log.end_time?.slice(0, 5) ?? "",
      planned_depth_m: log.planned_depth_m != null ? String(Number(log.planned_depth_m)) : "",
      reached_depth_m: log.reached_depth_m != null ? String(Number(log.reached_depth_m)) : "",
      dives_count: log.dives_count != null ? String(log.dives_count) : "",
      discipline: log.discipline ?? "",
      breathing_apparatus: !!log.breathing_apparatus,
      gas_mix: log.gas_mix ?? "",
      notes: log.notes ?? "",
    });
    setEditOpen(true);
  };

  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const txt = (v: string) => (v.trim() === "" ? null : v.trim());

  const handleSaveEdit = async () => {
    if (!log) return;
    try {
      await updateLog.mutateAsync({
        id: log.id,
        start_time: txt(form.start_time),
        end_time: txt(form.end_time),
        planned_depth_m: num(form.planned_depth_m),
        reached_depth_m: num(form.reached_depth_m),
        dives_count: num(form.dives_count),
        discipline: form.discipline.trim() || log.discipline,
        breathing_apparatus: form.breathing_apparatus,
        gas_mix: txt(form.gas_mix),
        notes: txt(form.notes),
      });
      toast.success(t("dldEditSaved"));
      setEditOpen(false);
    } catch (err) {
      console.error("dive log update failed", err);
      toast.error(t("dldEditFailed"));
    }
  };



  const handleDownloadPdf = async () => {
    if (!log) return;
    setPdfBusy(true);
    try {
      await downloadLogbookPdf({
        type: "dive_log_single",
        id: log.id,
        filename: `dive-log-${log.dive_date}.pdf`,
      });
    } catch (err) {
      toast.error(t("lbExportFailed"));
      console.error("dive log pdf export failed", err);
    } finally {
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    supabase
      .from("dive_log_signatures")
      .select("method")
      .eq("dive_log_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSigMethod(data?.method ?? null));
  }, [id, log?.verification_status]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!log) {
    return (
      <AppLayout>
        <div className="py-16 text-center text-muted-foreground">{t("dldNotFound")}</div>
      </AppLayout>
    );
  }

  const spotName = log.spot?.name ?? log.spot_label ?? "—";
  const env = log.spot?.environment_type ? mapEnvironmentType(log.spot.environment_type) : null;
  const personName = fullName(profile, "—");
  const isOwner = log.user_id === user?.id;
  const isSigned = log.verification_status === "verified" || !!sigMethod;
  const canEdit = isOwner && !isSigned;



  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight">{t("dldTitle")}</h1>
          <p className="text-xs text-muted-foreground">{formatDate(log.dive_date)}</p>
        </div>
        {canEdit && (
          <button
            onClick={openEdit}
            aria-label={t("dldEdit")}
            className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDownloadPdf}
          disabled={pdfBusy}
          aria-label={t("lbExportAll")}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
        </button>
      </header>


      {/* Hero */}
      <div className="card-session !rounded-2xl !p-4 mb-3 relative z-0">
        <h2 className="text-xl font-bold text-card-foreground">{log.discipline}</h2>
        <p className="text-sm text-[hsl(var(--card-muted))] mt-0.5">
          {spotName}
          {env ? ` · ${env}` : ""} · {formatDate(log.dive_date)}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--card-muted))]">{t("dldReachedDepth")}</p>
            <p className="text-lg font-bold text-card-foreground">
              {log.reached_depth_m != null ? `${Number(log.reached_depth_m)} m` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--card-muted))]">{t("dldDuration")}</p>
            <p className="text-lg font-bold text-card-foreground">{durationLabel(log.start_time, log.end_time)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--card-muted))]">{t("dldDives")}</p>
            <p className="text-lg font-bold text-card-foreground">{log.dives_count ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Link back to the session/event this log was generated from */}
      {logOrigin && (
        <button
          onClick={() => navigate(logOrigin.kind === "session" ? `/sessions/${logOrigin.id}` : `/events/${logOrigin.id}`)}
          className="w-full mb-4 rounded-2xl border border-border bg-muted/40 p-3 text-left flex items-center gap-3 hover:border-primary/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">
              {logOrigin.kind === "session" ? t("dldOriginSession") : t("dldOriginEvent")}
            </p>
            <p className="text-sm font-semibold truncate">{logOrigin.title}</p>
          </div>
          <span className="text-[11px] text-primary font-medium shrink-0">{t("dldOriginOpen")}</span>
        </button>
      )}

      <div className="mb-4 space-y-2">
        <VerificationBanner
          log={log}
          signatureMethod={sigMethod}
          selfManaged={selfManaged}
          onRequestSignature={selfManaged ? undefined : () => setSignatureOpen(true)}
        />
        {log.verification_status !== "verified"
          && (log.outing_type === "guided" || selfManaged)
          && isInstructor
          && log.user_id === user?.id && (
            <Button
              variant="outline"
              className="w-full h-10 gap-2"
              onClick={() => setAutofirmaOpen(true)}
              disabled={autofirma.isPending}
            >
              <PenSquare className="w-4 h-4" />
              {t("dldAutofirma")}
            </Button>
          )}
      </div>


      {hasPendingRequest && !isSigned && (
        <div className="mb-4">
          <Button className="w-full h-11 gap-2" onClick={() => setSignRequestOpen(true)}>
            <PenSquare className="w-4 h-4" />
            {t("dldSignRequested")}
          </Button>
        </div>
      )}

      {/* Immersione */}
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 mt-2">{t("dldSectionDive")}</h3>
      <section className="rounded-2xl bg-popover border border-border px-3 mb-4">
        <Row label={t("dldFieldLocation")} code="d" value={`${spotName}${env ? ` · ${env}` : ""}`} />
        <Row label={t("dldFieldDate")} code="c" value={formatDate(log.dive_date)} />
        <Row label={t("dldFieldStart")} code="e" value={log.start_time?.slice(0, 5) ?? "—"} />
        <Row label={t("dldFieldEnd")} code="f" value={log.end_time?.slice(0, 5) ?? "—"} />
        <Row label={t("dldFieldPlannedDepth")} code="i" value={log.planned_depth_m != null ? `${Number(log.planned_depth_m)} m` : "—"} />
        <Row label={t("dldFieldReachedDepth")} code="l" value={log.reached_depth_m != null ? `${Number(log.reached_depth_m)} m` : "—"} />
        <Row label={t("dldFieldDiscipline")} value={log.discipline} />
        <Row
          label={t("dldFieldApparatus")}
          value={log.breathing_apparatus ? t("dldApparatusYes") : t("dldApparatusNo")}
        />
        <Row label={t("dldFieldGasMix")} value={log.gas_mix ?? "Aria"} />
      </section>
      {isOwner && isSigned && (
        <p className="text-xs text-muted-foreground -mt-3 mb-4">{t("dldEditLocked")}</p>
      )}
      {canEdit && (
        <Button variant="outline" className="w-full h-10 gap-2 mb-4 -mt-2" onClick={openEdit}>
          <Pencil className="w-4 h-4" />
          {t("dldEdit")}
        </Button>
      )}



      {/* Persona */}
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{t("dldSectionPerson")}</h3>
      <section className="rounded-2xl bg-popover border border-border px-3 mb-4">
        <Row label={t("dldFieldIdentity")} code="a" value={personName} />
        <Row
          label={t("dldFieldBirth")}
          value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString(getLocale()) : "—"}
        />
        <Row
          label={t("dldFieldBrevetto")}
          code="b"
          value={registerBrevetto || (isOwner ? brevettoLabel(profile, certification) : null) || "—"}
        />

      </section>

      {/* Centro/Istruttore: only when there is a real attribution (register or signature) */}
      {(log.instructor_label || log.center_label || isSigned) && (
        <>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{t("dldSectionCenter")}</h3>
          <section className="rounded-2xl bg-popover border border-border px-3 mb-2">
            <Row label={t("dldFieldInstructor")} code="n" value={log.instructor_label ?? "—"} />
            <Row label={t("dldFieldCenter")} value={log.center_label ?? "—"} />
          </section>
          <p className="text-xs text-muted-foreground mb-4">
            {t("dldCenterNote")}
          </p>
        </>
      )}

      {/* Conformità */}
      <div className="mb-4">
        <ConformityNote />
      </div>

      {/* Note */}
      {log.notes && (
        <>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{t("dldSectionNotes")}</h3>
          <section className="rounded-2xl bg-popover border border-border p-3 mb-2">
            <p className="text-sm whitespace-pre-wrap">{log.notes}</p>
          </section>
          <p className="text-xs text-muted-foreground mb-6">{t("dldNotesFooter")}</p>
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dldEditTitle")}</DialogTitle>
            <DialogDescription>{t("dldEditDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dl-start">{t("dldFieldStart")}</Label>
              <Input
                id="dl-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-end">{t("dldFieldEnd")}</Label>
              <Input
                id="dl-end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-planned">{t("dldFieldPlannedDepth")}</Label>
              <Input
                id="dl-planned"
                type="number"
                inputMode="decimal"
                value={form.planned_depth_m}
                onChange={(e) => setForm((f) => ({ ...f, planned_depth_m: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-reached">{t("dldFieldReachedDepth")}</Label>
              <Input
                id="dl-reached"
                type="number"
                inputMode="decimal"
                value={form.reached_depth_m}
                onChange={(e) => setForm((f) => ({ ...f, reached_depth_m: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-discipline">{t("dldFieldDiscipline")}</Label>
              <Input
                id="dl-discipline"
                value={form.discipline}
                onChange={(e) => setForm((f) => ({ ...f, discipline: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-dives">{t("dldFieldDives")}</Label>
              <Input
                id="dl-dives"
                type="number"
                inputMode="numeric"
                value={form.dives_count}
                onChange={(e) => setForm((f) => ({ ...f, dives_count: e.target.value }))}
              />
            </div>
            <div className="col-span-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {t("dldAttributionLocked")}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-apparatus">{t("dldFieldApparatus")}</Label>
              <select
                id="dl-apparatus"
                value={form.breathing_apparatus ? "yes" : "no"}
                onChange={(e) => setForm((f) => ({ ...f, breathing_apparatus: e.target.value === "yes" }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="no">{t("dldApparatusNo")}</option>
                <option value="yes">{t("dldApparatusYes")}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dl-gas">{t("dldFieldGasMix")}</Label>
              <Input
                id="dl-gas"
                value={form.gas_mix}
                onChange={(e) => setForm((f) => ({ ...f, gas_mix: e.target.value }))}
                placeholder="Aria"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="dl-notes">{t("dldFieldNotes")}</Label>
              <Textarea
                id="dl-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <Button className="w-full h-10" onClick={handleSaveEdit} disabled={updateLog.isPending}>
            {t("dldEditSave")}
          </Button>
        </DialogContent>
      </Dialog>
      <RequestSignatureModal
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        diveLogId={log.id}
        defaultInstructorName={log.instructor_label}
      />

      <PasswordReauthDialog
        open={signRequestOpen}
        onOpenChange={setSignRequestOpen}
        title={t("dldSignRequestedTitle")}
        description={t("dldSignRequestedDesc")}
        confirmLabel={t("dldSignRequested")}
        onConfirm={async (password) => {
          await signRequested.mutateAsync({ diveLogId: log.id, password });
          toast.success(t("dldSignRequestedDone"));
        }}
      />
      <PasswordReauthDialog
        open={autofirmaOpen}
        onOpenChange={setAutofirmaOpen}
        title={t("dldAutofirmaTitle")}
        description={t("dldAutofirmaDesc")}
        confirmLabel={t("dldAutofirmaConfirm")}
        onConfirm={async (password) => {
          await autofirma.mutateAsync({ diveLogId: log.id, password });
          toast.success(t("dldAutofirmaDone"));
        }}
      />
    </AppLayout>
  );
};

export default DiveLogDetail;
