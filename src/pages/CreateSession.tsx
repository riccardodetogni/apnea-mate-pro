import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSpots } from "@/hooks/useSpots";
import { useMyGroups } from "@/hooks/useMyGroups";
import { supabase } from "@/integrations/supabase/client";
import { t, getSessionTypes, getLevels } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
  UsersRound,
  Info,
  CalendarDays,
} from "lucide-react";
import SpotSelector from "@/components/spots/SpotSelector";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import BatchDatePicker, { type SelectedDate } from "@/components/sessions/BatchDatePicker";

// Map environment_type to session_type
const environmentToSessionType: Record<string, string> = {
  sea: "sea_trip",
  pool: "pool_session",
  deep_pool: "deep_pool_session",
  lake: "lake_trip",
};

const CreateSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCertified, isInstructor, loading: profileLoading } = useProfile();
  const { spots, loading: spotsLoading } = useSpots();
  const { groups: myGroups, loading: groupsLoading } = useMyGroups();
  const { toast } = useToast();

  const sessionTypes = getSessionTypes();
  const levels = getLevels();

  const [submitting, setSubmitting] = useState(false);
  const [creatorJoins, setCreatorJoins] = useState(true);
  const [groupOnly, setGroupOnly] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [durationInput, setDurationInput] = useState("60");
  const [participantsInput, setParticipantsInput] = useState("6");
  const [form, setForm] = useState({
    title: "",
    description: "",
    spot_id: "",
    group_id: "",
    session_type: "sea_trip",
    level: "all_levels",
    date: "",
    time: "",
    duration_minutes: 60,
    max_participants: 6,
    is_paid: false,
  });

  const canCreate = isCertified || isInstructor;
  const canBatch = isInstructor || myGroups.length > 0;

  useEffect(() => {
    if (form.spot_id) {
      const selectedSpot = spots.find((s) => s.id === form.spot_id);
      if (selectedSpot && selectedSpot.environment_type) {
        const mappedType = environmentToSessionType[selectedSpot.environment_type];
        if (mappedType) {
          setForm((prev) => ({ ...prev, session_type: mappedType }));
        }
      }
    }
  }, [form.spot_id, spots]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDurationInput(e.target.value);
  };

  const handleDurationBlur = () => {
    const parsed = parseInt(durationInput, 10);
    if (isNaN(parsed) || parsed < 30) {
      setDurationInput("30");
      setForm((prev) => ({ ...prev, duration_minutes: 30 }));
    } else if (parsed > 480) {
      setDurationInput("480");
      setForm((prev) => ({ ...prev, duration_minutes: 480 }));
    } else {
      setDurationInput(String(parsed));
      setForm((prev) => ({ ...prev, duration_minutes: parsed }));
    }
  };

  const handleParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParticipantsInput(e.target.value);
  };

  const handleParticipantsBlur = () => {
    const parsed = parseInt(participantsInput, 10);
    if (isNaN(parsed) || parsed < 2) {
      setParticipantsInput("2");
      setForm((prev) => ({ ...prev, max_participants: 2 }));
    } else if (parsed > 50) {
      setParticipantsInput("50");
      setForm((prev) => ({ ...prev, max_participants: 50 }));
    } else {
      setParticipantsInput(String(parsed));
      setForm((prev) => ({ ...prev, max_participants: parsed }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !canCreate) return;

    if (!form.title.trim()) {
      toast({ title: t("error"), description: t("insertTitle"), variant: "destructive" });
      return;
    }

    if (!form.spot_id) {
      toast({ title: t("error"), description: t("selectSpot"), variant: "destructive" });
      return;
    }

    if (multiMode) {
      if (selectedDates.length === 0) {
        toast({ title: t("error"), description: t("selectAtLeastOneDate"), variant: "destructive" });
        return;
      }
      for (const sd of selectedDates) {
        if (!sd.time) {
          toast({ title: t("error"), description: t("insertTimeForAllDates"), variant: "destructive" });
          return;
        }
        const dt = new Date(`${sd.date}T${sd.time}`);
        if (dt <= new Date()) {
          toast({ title: t("error"), description: t("allDatesMustBeFuture"), variant: "destructive" });
          return;
        }
      }
    } else {
      if (!form.date || !form.time) {
        toast({ title: t("error"), description: t("insertDateAndTime"), variant: "destructive" });
        return;
      }
      const dateTime = new Date(`${form.date}T${form.time}`);
      if (dateTime <= new Date()) {
        toast({ title: t("error"), description: t("dateMustBeFuture"), variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);

    try {
      const isPublic = !(groupOnly && form.group_id);
      const datesToCreate = multiMode
        ? selectedDates.map((sd) => new Date(`${sd.date}T${sd.time}`))
        : [new Date(`${form.date}T${form.time}`)];

      const results = await Promise.all(
        datesToCreate.map(async (dateTime) => {
          const { data, error } = await supabase
            .from("sessions")
            .insert({
              title: form.title.trim(),
              description: form.description.trim() || null,
              spot_id: form.spot_id,
              group_id: form.group_id || null,
              session_type: form.session_type,
              level: form.level,
              date_time: dateTime.toISOString(),
              duration_minutes: form.duration_minutes,
              max_participants: form.max_participants,
              creator_id: user.id,
              is_public: isPublic,
              is_paid: isInstructor ? form.is_paid : false,
              status: "active",
            })
            .select("id")
            .single();

          if (error) throw error;

          if (creatorJoins && data) {
            await supabase
              .from("session_participants")
              .insert({
                session_id: data.id,
                user_id: user.id,
                status: "confirmed",
              });
          }

          return data;
        })
      );

      if (multiMode) {
        toast({
          title: `${results.length} ${t("sessionsCreated")}`,
          description: t("sessionsPublishedDesc"),
        });
        navigate("/my-sessions");
      } else {
        toast({
          title: t("sessionCreatedTitle"),
          description: t("sessionCreatedDesc"),
        });
        navigate(`/sessions/${results[0].id}`);
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      if (error.message?.includes("row-level security")) {
        toast({
          title: t("unauthorized"),
          description: t("mustBeCertifiedToCreate"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("error"),
          description: error.message || t("cannotCreateSession"),
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">{t("newSessionTitle")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {!canCreate ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t("certificationRequired")}</h3>
            <p className="text-sm text-muted mb-6">
              {t("certificationRequiredDesc")}
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              {t("goToProfile")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("titleRequired")}</Label>
              <Input
                id="title"
                placeholder={t("titlePlaceholder")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Spot */}
            <div className="space-y-2">
              <Label>{t("spotLabel")}</Label>
              <SpotSelector
                spots={spots}
                selectedSpotId={form.spot_id}
                onSelect={(spotId) => setForm({ ...form, spot_id: spotId })}
                loading={spotsLoading}
                onSpotCreated={() => {}}
              />
            </div>

            {/* Group (optional) */}
            {myGroups.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t("groupOptional")}</Label>
                  <Select value={form.group_id} onValueChange={(v) => {
                    setForm({ ...form, group_id: v === "none" ? "" : v });
                    if (v === "none") setGroupOnly(false);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("noGroup")}>
                        {form.group_id ? (
                          <span className="flex items-center gap-2">
                            <UsersRound className="w-4 h-4" />
                            {myGroups.find(g => g.id === form.group_id)?.name}
                          </span>
                        ) : (
                          t("noGroup")
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("noGroup")}</SelectItem>
                      {myGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          <span className="flex items-center gap-2">
                            <UsersRound className="w-4 h-4" />
                            {group.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.group_id && (
                  <div className="flex items-center space-x-3 py-2 px-3 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="groupOnly"
                      checked={groupOnly}
                      onCheckedChange={(checked) => setGroupOnly(checked === true)}
                    />
                    <label htmlFor="groupOnly" className="text-sm leading-tight">
                      <span className="font-medium">{t("groupOnlyLabel")}</span>
                      <span className="block text-muted-foreground text-xs mt-0.5">
                        {t("groupOnlyDesc")}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Type & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("sessionTypeLabel")}</Label>
                <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map(st => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("levelLabel")}</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Multi-mode toggle */}
            {canBatch && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={!multiMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMultiMode(false)}
                  className="flex-1 gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t("singleSession")}
                </Button>
                <Button
                  type="button"
                  variant={multiMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMultiMode(true)}
                  className="flex-1 gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t("multipleDates")}
                </Button>
              </div>
            )}

            {/* Date & Time */}
            {multiMode ? (
              <BatchDatePicker
                selectedDates={selectedDates}
                onDatesChange={setSelectedDates}
                defaultTime={form.time || "09:00"}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">{t("dateLabel")}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{t("timeLabel")}</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <Input
                      id="time"
                      type="time"
                      className="pl-10"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Duration & Max Participants */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="duration">{t("durationLabel")}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={30}
                  max={480}
                  step={15}
                  value={durationInput}
                  onChange={handleDurationChange}
                  onBlur={handleDurationBlur}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">{t("maxParticipantsLabel")}</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="max"
                    type="number"
                    min={2}
                    max={50}
                    className="pl-10"
                    value={participantsInput}
                    onChange={handleParticipantsChange}
                    onBlur={handleParticipantsBlur}
                  />
                </div>
              </div>
            </div>

            {/* Creator joins as participant */}
            <div className="flex items-center space-x-3 py-2">
              <Checkbox
                id="creatorJoins"
                checked={creatorJoins}
                onCheckedChange={(checked) => setCreatorJoins(checked === true)}
              />
              <label
                htmlFor="creatorJoins"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("creatorJoinsLabel")}
              </label>
            </div>

            {/* Paid session - only for instructors and admins */}
            {isInstructor && (
              <div className="flex items-center space-x-3 py-2">
                <Checkbox
                  id="isPaid"
                  checked={form.is_paid}
                  onCheckedChange={(checked) => setForm({ ...form, is_paid: checked === true })}
                />
                <label
                  htmlFor="isPaid"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("paidSession")}
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px] text-xs">
                    {t("paidSessionDisclaimer")}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primaryGradient"
              className="w-full"
              disabled={submitting || (multiMode && selectedDates.length === 0)}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("creating")}
                </>
              ) : multiMode ? (
                `${t("publishSessions")} ${selectedDates.length} session${selectedDates.length === 1 ? "e" : "i"}`
              ) : (
                t("publishSession")
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateSession;
