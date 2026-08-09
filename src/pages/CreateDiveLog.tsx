import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDiveLog } from "@/hooks/useDiveLogs";
import { useSpots } from "@/hooks/useSpots";
import { useProfile } from "@/hooks/useProfile";
import SpotSelector from "@/components/spots/SpotSelector";
import { ConformityNote } from "@/components/logbook/ConformityNote";
import { fullName } from "@/lib/format";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

const DISCIPLINES = [
  "discAssettoCostante",
  "discAssettoVariabile",
  "discFreeImmersion",
  "discEsplorazione",
  "discAltro",
];

const CreateDiveLog = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { spots, loading: spotsLoading } = useSpots();
  const createMutation = useCreateDiveLog();

  const [discipline, setDiscipline] = useState<string>("discAssettoCostante");
  const [spotId, setSpotId] = useState<string>("");
  const [diveDate, setDiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [plannedDepth, setPlannedDepth] = useState<string>("");
  const [reachedDepth, setReachedDepth] = useState<string>("");
  const [divesCount, setDivesCount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const selectedSpot = spots.find((s) => s.id === spotId);
  const personLabel = fullName(profile, "—");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipline || !diveDate) {
      toast.error(t("cdlErrorFillFields"));
      return;
    }
    try {
      const id = await createMutation.mutateAsync({
        outing_type: "free",
        discipline: t(discipline as any),
        spot_id: spotId || null,
        spot_label: selectedSpot?.name ?? null,
        dive_date: diveDate,
        start_time: startTime || null,
        end_time: endTime || null,
        planned_depth_m: plannedDepth ? Number(plannedDepth) : null,
        reached_depth_m: reachedDepth ? Number(reachedDepth) : null,
        dives_count: divesCount ? Number(divesCount) : null,
        notes: notes || null,
      });
      toast.success(t("cdlSaved"));
      navigate(`/logbook/${id}`);
    } catch (err: any) {
      toast.error(err.message ?? t("cdlErrorSaving"));
    }
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("cdlTitle")}</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed rounded-2xl bg-secondary/60 border border-border p-3">
          {t("cdlPersonalNote")}
        </p>


        <section className="rounded-2xl bg-secondary/60 border border-border p-3 space-y-2">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("cdlPrefilled")}</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("cdlPerson")}</span>
            <span className="font-medium">{personLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("cdlLocation")}</span>
            <span className="font-medium text-right">{selectedSpot?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("cdlDateTime")}</span>
            <span className="font-medium text-right">
              {diveDate}
              {startTime ? ` · ${startTime}${endTime ? `–${endTime}` : ""}` : ""}
            </span>
          </div>
        </section>

        <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground pt-1">{t("cdlToComplete")}</h3>

        <div className="space-y-1.5">
          <Label>{t("cdlDisciplineLabel")}</Label>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger><SelectValue>{t(discipline as any)}</SelectValue></SelectTrigger>
            <SelectContent>
              {DISCIPLINES.map((d) => (
                <SelectItem key={d} value={d}>{t(d as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("cdlLocation")}</Label>
          <SpotSelector
            spots={spots}
            selectedSpotId={spotId}
            onSelect={setSpotId}
            loading={spotsLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>{t("cdlDate")}</Label>
            <Input type="date" value={diveDate} onChange={(e) => setDiveDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cdlStart")}</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cdlEnd")}</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cdlPlannedDepth")}</Label>
            <Input type="number" inputMode="numeric" placeholder="25" value={plannedDepth} onChange={(e) => setPlannedDepth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("cdlReachedDepth")}</Label>
            <Input type="number" inputMode="numeric" placeholder="22" value={reachedDepth} onChange={(e) => setReachedDepth(e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>{t("cdlDivesCount")}</Label>
            <Input type="number" inputMode="numeric" placeholder="5" value={divesCount} onChange={(e) => setDivesCount(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("cdlNotes")} <span className="text-muted-foreground text-xs">{t("cdlNotesOptional")}</span></Label>
          <Textarea
            placeholder={t("cdlNotesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <div className="rounded-2xl bg-secondary/60 border border-border p-3">
          <ConformityNote compact />
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={createMutation.isPending}>
          {createMutation.isPending ? t("saving") : t("cdlSubmit")}
        </Button>
      </form>
    </AppLayout>
  );
};

export default CreateDiveLog;
