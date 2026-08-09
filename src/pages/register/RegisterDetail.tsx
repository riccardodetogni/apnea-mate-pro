import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, X, Star, UserPlus, Printer, Download, Trash2, DownloadCloud, Search, PenSquare, Check, FileSpreadsheet } from "lucide-react";
import {
  useDiveRegisterDetail,
  useRegisterMutations,
  type RegisterParticipant,
  type AttendanceStatus,
} from "@/hooks/useDiveRegisters";
import { useSignParticipants } from "@/hooks/useSigning";
import { StatusBadge } from "@/components/register/StatusBadge";
import { PasswordReauthDialog } from "@/components/logbook/PasswordReauthDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { t, getLocale } from "@/lib/i18n";
import { downloadLogbookPdf } from "@/lib/logbookPdf";
import { downloadLogbookXlsx, type LogbookXlsxType } from "@/lib/logbookXlsx";

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: () => string }[] = [
  { value: "present", label: () => t("rdAttendPresent") },
  { value: "absent", label: () => t("rdAttendAbsent") },
  { value: "not_participating", label: () => t("rdAttendNotPart") },
];

const AttendancePill = ({
  value,
  disabled,
  onChange,
}: {
  value: AttendanceStatus;
  disabled?: boolean;
  onChange: (v: AttendanceStatus) => void;
}) => {
  const tone =
    value === "present"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      : value === "absent"
      ? "bg-white/10 text-muted-foreground border-white/15"
      : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AttendanceStatus)}
      className={`h-7 text-[11px] font-semibold px-2 rounded-full border ${tone} bg-transparent disabled:opacity-60`}
      aria-label={t("rdAttendanceLbl")}
    >
      {ATTENDANCE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value} className="text-foreground bg-background">
          {o.label()}
        </option>
      ))}
    </select>
  );
};

const ParticipantRow = ({
  p,
  editable,
  closed,
  canSignToday,
  selected,
  onToggleSelected,
  onRemove,
  onSetAttendance,
  onSignOne,
}: {
  p: RegisterParticipant;
  editable: boolean;
  closed: boolean;
  canSignToday: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onRemove: () => void;
  onSetAttendance: (v: AttendanceStatus) => void;
  onSignOne: () => void;
}) => {
  const isPresent = p.attendance_status === "present";
  const canSelectForSign = canSignToday && isPresent && !p.signed && !closed;
  return (
    <div className="flex items-center gap-2 py-2.5 px-1">
      {canSelectForSign ? (
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelected()} aria-label={t("rdSignRow")} />
      ) : (
        <div className="w-4 h-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-card-foreground">{p.display_name}</span>
          {p.is_guest && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {t("rdGuest")}
            </span>
          )}
          {p.signed && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
              <Check className="w-3 h-3" /> {t("rdSignedLbl")}
            </span>
          )}
        </div>
        {p.born_line && <p className="text-xs text-[hsl(var(--card-muted))]">{p.born_line}</p>}
        {p.brevetto_label && (
          <p className="text-[11px] text-card-foreground/70 mt-0.5">{p.brevetto_label}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editable && !closed && (
          <AttendancePill value={p.attendance_status} onChange={onSetAttendance} />
        )}
        {canSelectForSign && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onSignOne}>
            <PenSquare className="w-3.5 h-3.5 mr-1" />
            {t("rdSignRow")}
          </Button>
        )}
        {editable && !closed && (
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-full bg-secondary hover:bg-destructive/10 flex items-center justify-center"
            aria-label={t("rdRemoveAria")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

const RegisterDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reg, isLoading, error, refetch } = useDiveRegisterDetail(id);
  const {
    closeRegister,
    deleteRegister,
    removeParticipant,
    addMember,
    importFromSession,
    importFromEvent,
    setAttendance,
    updateOutingFields,
  } = useRegisterMutations(id);
  const signParticipants = useSignParticipants(id);

  const [endTime, setEndTime] = useState("");
  const [maxDepth, setMaxDepth] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<Array<{ user_id: string; name: string; last_name: string | null }>>([]);
  const [searchingMember, setSearchingMember] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<null | "pack" | "check">(null);
  const [xlsxBusy, setXlsxBusy] = useState<null | LogbookXlsxType>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [signOpen, setSignOpen] = useState(false);
  const [signPayload, setSignPayload] = useState<string[] | null>(null);
  const [closeWarnOpen, setCloseWarnOpen] = useState(false);
  const searchTimer = useRef<number | null>(null);

  // Legge 70 outing-level fields
  const [fStart, setFStart] = useState("");
  const [fCenter, setFCenter] = useState("");

  useEffect(() => {
    if (!reg) return;
    setFStart(reg.start_time ? reg.start_time.slice(0, 5) : "");
    setFCenter(reg.center_label ?? "");
  }, [reg?.id, reg?.start_time, reg?.center_label]);

  // NOTE: hooks (useMemo) must be declared before any early return
  const signableParticipants = useMemo(
    () =>
      (reg?.participants ?? []).filter(
        (p) => p.attendance_status === "present" && !p.signed && p.dive_log_id,
      ),
    [reg?.participants],
  );

  const handleSaveOutingFields = async () => {
    if (!reg) return;
    try {
      await updateOutingFields.mutateAsync({
        id: reg.id,
        start_time: fStart || null,
        ...(reg.center_label ? {} : { center_label: fCenter.trim() || null }),
      });
      toast.success(t("rdFieldsSaved"));
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };


  const handleDownloadRegisterPdf = async (kind: "pack" | "check") => {
    if (!id) return;
    setPdfBusy(kind);
    try {
      await downloadLogbookPdf({
        type: kind === "pack" ? "register_pack" : "register_check",
        id,
        filename: kind === "pack" ? `pacchetto-uscita-${id}.pdf` : `registro-verifica-${id}.pdf`,
      });
    } catch (err) {
      toast.error(t("lbExportFailed"));
      console.error("register pdf export failed", err);
    } finally {
      setPdfBusy(null);
    }
  };

  const handleDownloadXlsx = async (kind: "register" | "libretti") => {
    if (!id) return;
    setXlsxBusy(kind);
    try {
      await downloadLogbookXlsx({ type: kind, id });
    } catch (err) {
      toast.error(t("lbExportFailed"));
      console.error("register xlsx export failed", err);
    } finally {
      setXlsxBusy(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-10 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (error || !reg) {
    if (error) console.error("RegisterDetail load error:", error);
    return (
      <AppLayout>
        <div className="py-10 px-4 max-w-md mx-auto text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {error?.message ?? t("error")}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => refetch()}>{t("retry") || "Riprova"}</Button>
            <Button onClick={() => navigate(-1)}>{t("back") || "Indietro"}</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const closed = reg.status === "chiuso";
  const editable = !closed;
  const multiResp = reg.responsible_count > 1;
  const dateLabel = reg.register_date
    ? new Date(reg.register_date).toLocaleDateString(getLocale(), {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const retentionLabel = reg.retention_until
    ? new Date(reg.retention_until).toLocaleDateString(getLocale())
    : "—";

  // Signing unlocks only once the outing has actually started (date + start time).
  const startedAt = new Date(`${reg.register_date}T${(reg.start_time ?? "00:00:00").slice(0, 8)}`);
  const canSignToday = !closed && startedAt.getTime() <= Date.now();

  const signableIds = signableParticipants.map((p) => p.id);

  const selectedCount = signableIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = signableIds.length > 0 && selectedCount === signableIds.length;

  const toggleSelect = (pid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(signableIds));
  };
  const openSignDialog = (payload: string[] | null) => {
    setSignPayload(payload);
    setSignOpen(true);
  };
  const confirmSign = async (password: string) => {
    const n = await signParticipants.mutateAsync({ participantIds: signPayload, password });
    toast.success(t("rdSignedCount", { n }));
    setSelectedIds(new Set());
  };
  const handleSetAttendance = async (participantId: string, status: AttendanceStatus) => {
    try {
      await setAttendance.mutateAsync({ participantId, status });
      setSelectedIds((prev) => {
        if (status === "present") return prev;
        const next = new Set(prev);
        next.delete(participantId);
        return next;
      });
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };


  const unsignedPresentCount = reg.participants.filter(
    (p) => p.attendance_status === "present" && !p.signed,
  ).length;

  const handleClose = async () => {
    if (!endTime) {
      toast.error(t("rdMissingEndTime"));
      return;
    }
    if (unsignedPresentCount > 0 && !closeWarnOpen) {
      setCloseWarnOpen(true);
      return;
    }
    setCloseWarnOpen(false);
    try {
      await closeRegister.mutateAsync({
        id: reg.id,
        end_time: endTime,
        max_depth_m: maxDepth ? Number(maxDepth) : null,
      });
      toast.success(t("rdClosed"));
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRegister.mutateAsync(reg.id);
      toast.success(t("rdCanceled"));
      navigate("/registro");
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };

  const handleImportFromSession = async () => {
    if (!reg.session_id) return;
    try {
      const n = await importFromSession.mutateAsync({ registerId: reg.id, sessionId: reg.session_id });
      if (n === 0) toast.info(t("rdImportNone"));
      else toast.success(t("rdImported", { n }));
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };

  const handleImportFromEvent = async () => {
    if (!reg.event_id) return;
    try {
      const n = await importFromEvent.mutateAsync({ registerId: reg.id, eventId: reg.event_id });
      if (n === 0) toast.info(t("rdImportNone"));
      else toast.success(t("rdImported", { n }));
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };



  // Debounced: avoids a query per keystroke while typing a name.
  const runMemberSearch = (q: string) => {
    setMemberQuery(q);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    if (q.trim().length < 2) {
      setMemberResults([]);
      setSearchingMember(false);
      return;
    }
    setSearchingMember(true);
    searchTimer.current = window.setTimeout(() => void doMemberSearch(q), 350);
  };

  const doMemberSearch = async (q: string) => {
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, last_name")
      .or(`name.ilike.${term},last_name.ilike.${term}`)
      .limit(8);
    setMemberResults((data ?? []) as any);
    setSearchingMember(false);
  };

  const handleAddMember = async (uid: string) => {
    try {
      await addMember.mutateAsync({ registerId: reg.id, userId: uid });
      toast.success(t("rdMemberAdded"));
      setMemberQuery("");
      setMemberResults([]);
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("duplicate")) toast.error(t("rdAlreadyIn"));
      else toast.error(msg || t("error"));
    }
  };

  return (
    <AppLayout>
      <header className="flex items-start gap-3 mb-3">
        <button
          onClick={() => navigate("/registro")}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center shrink-0"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground leading-tight">{reg.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {reg.spot_label ?? "—"} · {dateLabel}
          </p>
        </div>
        <StatusBadge status={reg.status} />
      </header>

      {/* Dati uscita (L. 70) */}
      <section className="mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("rdOutingFields")}
        </h2>
        <div className="card-session !rounded-2xl !p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs text-card-foreground">{t("rdStartTimeLbl")}</Label>
            <Input
              type="time"
              value={fStart}
              onChange={(e) => setFStart(e.target.value)}
              className="w-28 shrink-0"
            />
          </div>
          {reg.center_label ? (
            <div className="flex items-start justify-between gap-3">
              <Label className="text-xs text-card-foreground">{t("rdCenterName")}</Label>
              <div className="text-right min-w-0">
                <span className="text-sm text-card-foreground break-words">{reg.center_label}</span>
                <p className="text-[11px] text-[hsl(var(--card-muted))] mt-0.5">
                  {t("rdCenterFromGroup")}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs text-card-foreground">{t("rdCenterName")}</Label>
              <Input
                value={fCenter}
                onChange={(e) => setFCenter(e.target.value)}
                placeholder={t("rdCenterNamePh")}
              />
            </div>
          )}

          <p className="text-xs text-[hsl(var(--card-muted))]">
            {closed ? t("rdOutingFieldsClosedNote") : t("rdOutingFieldsNote")}
          </p>
          <Button
            variant="secondary"
            className="w-full h-10"
            onClick={handleSaveOutingFields}
            disabled={updateOutingFields.isPending}
          >
            {t("rdSaveFields")}
          </Button>
        </div>
      </section>



      {/* Responsabili */}
      <section className="mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("rdResponsibles")}
        </h2>
        <div className="card-session !rounded-2xl !p-3">
          {reg.responsibles.length === 0 ? (
            <p className="text-sm text-[hsl(var(--card-muted))] py-2 px-1">{t("rdNoResp")}</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {reg.responsibles.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5 px-1">
                  {r.is_school && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                  <span className="flex-1 text-sm font-medium text-card-foreground">{r.name}</span>
                  <span className="text-xs text-card-foreground/70">{r.brevetto_label ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Partecipanti */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("rdParticipants")}
          </h2>
          {reg.start_time && (
            <span className="text-[11px] text-muted-foreground">{t("rdStartAt")} {reg.start_time.slice(0, 5)}</span>
          )}
        </div>
        {canSignToday && signableIds.length > 0 && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              aria-label={t("rdSelectAll")}
            />
            <span className="text-xs text-card-foreground flex-1">
              {selectedCount > 0
                ? t("rdSelectedCount", { n: selectedCount })
                : t("rdSelectAll")}
            </span>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={() => openSignDialog(selectedCount > 0 ? Array.from(selectedIds).filter((id) => signableIds.includes(id)) : null)}
              disabled={signParticipants.isPending}
            >
              <PenSquare className="w-3.5 h-3.5" />
              {selectedCount > 0 ? t("rdSignSelected") : t("rdSignAll")}
            </Button>
          </div>
        )}
        <div className="card-session !rounded-2xl !p-3">
          {reg.participants.length === 0 ? (
            <div className="py-2 px-1">
              <p className="text-sm text-[hsl(var(--card-muted))]">{t("rdNoPart")}</p>
              {editable && (
                <p className="text-xs text-[hsl(var(--card-muted))] mt-1">{t("rdNoPartHint")}</p>
              )}
            </div>

          ) : (
            <ul className="divide-y divide-white/10">
              {reg.participants.map((p) => (
                <li key={p.id}>
                  <ParticipantRow
                    p={p}
                    editable={editable}
                    closed={closed}
                    canSignToday={canSignToday}
                    selected={selectedIds.has(p.id)}
                    onToggleSelected={() => toggleSelect(p.id)}
                    onRemove={() => removeParticipant.mutate(p.id)}
                    onSetAttendance={(v) => handleSetAttendance(p.id, v)}
                    onSignOne={() => openSignDialog([p.id])}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        {editable && (
          <div className="mt-3 space-y-2">
            {reg.session_id && (
              <Button
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={handleImportFromSession}
                disabled={importFromSession.isPending}
              >
                <DownloadCloud className="w-4 h-4" /> {t("rdImportBtn")}
              </Button>
            )}
            {reg.event_id && (
              <Button
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={handleImportFromEvent}
                disabled={importFromEvent.isPending}
              >
                <DownloadCloud className="w-4 h-4" /> {t("rdImportEventBtn")}
              </Button>
            )}
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <Label className="text-xs text-foreground">{t("rdAddMember")}</Label>
              <div className="mt-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={memberQuery}
                  onChange={(e) => runMemberSearch(e.target.value)}
                  placeholder={t("rdMemberPh")}
                  className="h-9"
                />
              </div>
              {searchingMember && (
                <p className="text-[11px] text-muted-foreground mt-2">{t("rdSearching")}</p>
              )}
              {memberResults.length > 0 && (
                <ul className="mt-2 divide-y divide-border/60 rounded-lg border border-border bg-background">
                  {memberResults.map((m) => (
                    <li key={m.user_id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">
                        {[m.name, m.last_name].filter(Boolean).join(" ")}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddMember(m.user_id)}
                        disabled={addMember.isPending}
                      >
                        {t("rdAdd")}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => navigate(`/registro/${reg.id}/ospite`)}
              className="w-full rounded-xl border border-dashed border-primary/40 py-3 text-sm font-medium text-primary flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> {t("rdAddGuest")}
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          {t("rdPartFooter")}
        </p>
      </section>

      {/* State-specific */}

      {reg.status === "aperto" && (
        <section className="space-y-3 mb-4">
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => handleDownloadRegisterPdf("pack")}
            disabled={pdfBusy !== null}
          >
            <Printer className="w-4 h-4" /> {t("rdPrintPack")}
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => handleDownloadXlsx("register")}
            disabled={xlsxBusy !== null}
          >
            <FileSpreadsheet className="w-4 h-4" /> {t("rdExportRegisterXlsx")}
          </Button>
          {reg.event_id && (
            <p className="text-xs text-muted-foreground leading-relaxed">{t("rdRegisterTemplateNote")}</p>
          )}
          {multiResp && (
            <Button
              variant="secondary"
              className="w-full h-11"
              onClick={() => navigate(`/registro/${reg.id}/assign`)}
            >
              {t("rdAssignGroups")}
            </Button>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("rdPrePostNote")}
          </p>

          <div className="card-session !rounded-2xl !p-4 space-y-3">
            <h3 className="font-semibold text-card-foreground text-sm">{t("rdClosureTitle")}</h3>
            <div>
              <Label className="text-xs text-card-foreground">{t("rdEndTime")}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-card-foreground">{t("rdMaxDepth")}</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value)}
                placeholder={t("rdMaxDepthPh")}
              />
            </div>
            <p className="text-xs text-[hsl(var(--card-muted))]">
              {t("rdClosureNote")}
            </p>
            <Button className="w-full h-11" onClick={handleClose} disabled={closeRegister.isPending}>
              {t("rdCloseBtn")}
            </Button>
            <AlertDialog open={closeWarnOpen} onOpenChange={setCloseWarnOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("rdCloseWarnTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("rdCloseWarnDesc", { n: unsignedPresentCount })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClose}>{t("rdCloseAnyway")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      )}

      {closed && (
        <section className="space-y-3 mb-4">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <p className="font-semibold">
              {t("rdClosedBanner")} {retentionLabel}
            </p>
            <p className="text-xs mt-1 opacity-80">
              {t("rdClosedBannerSub")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("rdClosedFooter")}
          </p>
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => handleDownloadRegisterPdf("check")}
            disabled={pdfBusy !== null}
          >
            <Download className="w-4 h-4" /> {t("rdExportForCheck")}
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => handleDownloadXlsx("register")}
            disabled={xlsxBusy !== null}
          >
            <FileSpreadsheet className="w-4 h-4" /> {t("rdExportRegisterXlsx")}
          </Button>
          {reg.event_id && (
            <p className="text-xs text-muted-foreground leading-relaxed">{t("rdRegisterTemplateNote")}</p>
          )}
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => handleDownloadXlsx("libretti")}
            disabled={xlsxBusy !== null}
          >
            <FileSpreadsheet className="w-4 h-4" /> {t("rdExportLibrettiXlsx")}
          </Button>

          <div className="card-session !rounded-2xl !p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--card-muted))] mb-1">
              {t("rdLibrettiDoc")}
            </p>
            <Button
              className="w-full h-11 mt-1"
              onClick={() => navigate(`/registro/${id}/libretti`)}
            >
              {t("rdGoLibretti")}
            </Button>
            <Button
              variant="outline"
              disabled
              className="w-full h-11 mt-2 gap-2"
            >
              <Download className="w-4 h-4" /> {t("rdExportSigned")}
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/60 p-3 text-xs text-muted-foreground leading-relaxed">
            {t("rdCannotDelete")}
          </div>
        </section>
      )}

      {!closed && (
        <section className="mt-6 mb-6">
          <Button
            variant="outline"
            className="w-full h-11 gap-2 text-destructive border-destructive/30"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-4 h-4" /> {t("rdCancelSession")}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {t("rdCancelNote")}
          </p>
        </section>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rdCancelDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("rdCancelDialogDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteRegister.isPending}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PasswordReauthDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        title={t("rdSignConfirmTitle")}
        description={
          signPayload === null
            ? t("rdSignConfirmAll")
            : t("rdSignConfirmSel", { n: signPayload.length })
        }
        confirmLabel={t("rdSignRow")}
        onConfirm={confirmSign}
      />
    </AppLayout>
  );
};

export default RegisterDetail;
