import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useCreateRegister } from "@/hooks/useDiveRegisters";
import { useSpots } from "@/hooks/useSpots";
import SpotSelector from "@/components/spots/SpotSelector";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

const CreateRegister = () => {
  const navigate = useNavigate();
  const { verifiedGroupIds } = useStaffAccess();
  const { spots } = useSpots();
  const createRegister = useCreateRegister();

  const SAFETY_ITEMS = [
    t("crSafety1"),
    t("crSafety2"),
    t("crSafety3"),
    t("crSafety4"),
    t("crSafety5"),
  ];

  const [title, setTitle] = useState("");
  const [spotId, setSpotId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [responsibleCount, setResponsibleCount] = useState(1);
  const [expectedParticipants, setExpectedParticipants] = useState<number | "">("");
  const [safetyChecks, setSafetyChecks] = useState<Record<string, boolean>>({});
  const [disclaimer, setDisclaimer] = useState(false);

  const canPublish = disclaimer && title.trim().length > 0 && date;

  const handleSubmit = async () => {
    if (!canPublish) return;
    const spot = spots.find((s) => s.id === spotId);
    try {
      const id = await createRegister.mutateAsync({
        title: title.trim(),
        register_date: date,
        start_time: startTime || null,
        spot_id: spotId || null,
        spot_label: spot ? `${spot.name} · ${spot.location}` : null,
        org_group_id: verifiedGroupIds[0] ?? null,
        safety_checklist: safetyChecks,
      });
      toast.success(t("crPublished"));
      navigate(`/registro/${id}`);
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
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
        <h1 className="text-xl font-bold text-foreground">{t("crTitle")}</h1>
      </header>

      <div className="card-session !rounded-2xl !p-4 space-y-3 mb-4">
        <div>
          <Label className="text-xs text-card-foreground">{t("crFieldTitle")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("crTitlePh")} />
        </div>
        <div>
          <Label className="text-xs text-card-foreground">{t("crFieldSpot")}</Label>
          <SpotSelector spots={spots} selectedSpotId={spotId} onSelect={setSpotId} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-card-foreground">{t("crFieldDate")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("crFieldStart")}</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>
      </div>

      <section className="mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("crResponsibles")}
        </h2>
        <div className="card-session !rounded-2xl !p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setResponsibleCount(n)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium border ${
                  responsibleCount === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("crExpected")}</Label>
            <Input
              type="number"
              value={expectedParticipants}
              onChange={(e) =>
                setExpectedParticipants(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={t("crExpectedPh")}
            />
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("crChecklist")}
        </h2>
        <div className="card-session !rounded-2xl !p-3">
          <ul className="divide-y divide-white/10">
            {SAFETY_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-3 py-2.5 px-1">
                <Checkbox
                  checked={!!safetyChecks[item]}
                  onCheckedChange={(v) =>
                    setSafetyChecks((prev) => ({ ...prev, [item]: !!v }))
                  }
                />
                <span className="text-sm text-card-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-secondary/60 p-4 text-xs text-foreground/80 leading-relaxed mb-4">
        {t("crFaunaNote")}
      </div>

      <label className="flex items-start gap-3 card-session !rounded-2xl !p-4 mb-4 cursor-pointer">
        <Checkbox checked={disclaimer} onCheckedChange={(v) => setDisclaimer(!!v)} className="mt-0.5" />
        <span className="text-sm text-card-foreground leading-relaxed">
          {t("crDisclaimer")}
        </span>
      </label>

      <Button className="w-full h-11" disabled={!canPublish || createRegister.isPending} onClick={handleSubmit}>
        <Check className="w-4 h-4 mr-2" /> {t("crPublish")}
      </Button>
    </AppLayout>
  );
};

export default CreateRegister;
