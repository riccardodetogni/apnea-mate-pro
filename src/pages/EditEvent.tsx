import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { t, getEventTypes } from "@/lib/i18n";
import { ChevronLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface ScheduleDay {
  id?: string;
  day_number: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { isInstructor } = useProfile();

  const eventTypes = getEventTypes();

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "stage",
    start_date: "",
    end_date: "",
    location: "",
    max_participants: 0,
    is_paid: false,
    is_public: true,
    contact_email: "",
    contact_phone: "",
    contact_url: "",
  });

  const [hasSchedule, setHasSchedule] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: ev, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error || !ev) {
        toast({ title: t("error"), description: error?.message, variant: "destructive" });
        navigate(-1);
        return;
      }
      if (ev.creator_id !== user.id) {
        toast({ title: t("error"), variant: "destructive" });
        navigate(`/events/${id}`);
        return;
      }
      setForm({
        title: ev.title || "",
        description: ev.description || "",
        event_type: ev.event_type || "stage",
        start_date: ev.start_date || "",
        end_date: ev.end_date || "",
        location: ev.location || "",
        max_participants: ev.max_participants || 0,
        is_paid: !!ev.is_paid,
        is_public: !!ev.is_public,
        contact_email: ev.contact_email || "",
        contact_phone: ev.contact_phone || "",
        contact_url: ev.contact_url || "",
      });
      const { data: sch } = await supabase.from("event_schedule").select("*").eq("event_id", id).order("day_number");
      if (sch && sch.length > 0) {
        setHasSchedule(true);
        setSchedule(sch.map(s => ({
          id: s.id,
          day_number: s.day_number,
          title: s.title || "",
          description: s.description || "",
          start_time: s.start_time || "",
          end_time: s.end_time || "",
        })));
      }
      setFetching(false);
    })();
  }, [id, user]);

  const addScheduleDay = () => {
    setSchedule(prev => [...prev, { day_number: prev.length + 1, title: "", description: "", start_time: "", end_time: "" }]);
  };
  const updateScheduleDay = (index: number, field: keyof ScheduleDay, value: string | number) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };
  const removeScheduleDay = (index: number) => {
    setSchedule(prev => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, day_number: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!user || !id || !form.title || !form.start_date || !form.end_date) {
      toast({ title: t("fillRequiredFields"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("events").update({
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date,
        location: form.location || null,
        max_participants: form.max_participants,
        is_paid: isInstructor ? form.is_paid : false,
        is_public: form.is_public,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        contact_url: form.contact_url || null,
      }).eq("id", id);
      if (error) throw error;

      // Replace schedule
      await supabase.from("event_schedule").delete().eq("event_id", id);
      if (hasSchedule && schedule.length > 0) {
        const rows = schedule.filter(s => s.title).map(s => ({
          event_id: id,
          day_number: s.day_number,
          title: s.title,
          description: s.description || null,
          start_time: s.start_time || null,
          end_time: s.end_time || null,
        }));
        if (rows.length > 0) await supabase.from("event_schedule").insert(rows);
      }

      toast({ title: t("saveChanges") });
      navigate(`/events/${id}`);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <header className="mb-6 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{t("edit")}</h1>
        </div>
      </header>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>{t("eventType")}</Label>
          <div className="flex gap-2">
            {eventTypes.map(et => (
              <button
                key={et.value}
                onClick={() => setForm(f => ({ ...f, event_type: et.value }))}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${form.event_type === et.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-foreground border-border"}`}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("eventTitle")}</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>{t("eventDescription")}</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("startDate")}</Label>
            <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("endDate")}</Label>
            <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("location")}</Label>
          <LocationAutocomplete value={form.location} onChange={val => setForm(f => ({ ...f, location: val }))} />
        </div>

        <div className="space-y-2">
          <Label>{t("maxParticipants")} ({t("unlimitedParticipants")})</Label>
          <Input type="number" min={0} value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: parseInt(e.target.value) || 0 }))} />
        </div>

        {isInstructor && (
          <div className="flex items-center justify-between">
            <Label>{t("paidSession")}</Label>
            <Switch checked={form.is_paid} onCheckedChange={v => setForm(f => ({ ...f, is_paid: v }))} />
          </div>
        )}

        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="font-semibold text-foreground">{t("contactInfo")}</h3>
          <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} type="email" />
          <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} type="tel" />
          <Input value={form.contact_url} onChange={e => setForm(f => ({ ...f, contact_url: e.target.value }))} type="url" />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Label>{t("eventSchedule")}</Label>
            <Switch checked={hasSchedule} onCheckedChange={setHasSchedule} />
          </div>
          {hasSchedule && (
            <div className="space-y-3">
              {schedule.map((day, i) => (
                <div key={i} className="p-3 bg-secondary rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("dayLabel")} {day.day_number}</span>
                    <button onClick={() => removeScheduleDay(i)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <Input value={day.title} onChange={e => updateScheduleDay(i, "title", e.target.value)} />
                  <Textarea value={day.description} onChange={e => updateScheduleDay(i, "description", e.target.value)} rows={2} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="time" value={day.start_time} onChange={e => updateScheduleDay(i, "start_time", e.target.value)} />
                    <Input type="time" value={day.end_time} onChange={e => updateScheduleDay(i, "end_time", e.target.value)} />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addScheduleDay} className="w-full gap-2">
                <Plus className="w-4 h-4" /> {t("addDay")}
              </Button>
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveChanges")}
        </Button>
      </div>
    </AppLayout>
  );
};

export default EditEvent;