import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { t, getCourseTypes } from "@/lib/i18n";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useVerifiedGroups } from "@/hooks/useVerifiedGroups";

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { verifiedGroups, loading: groupsLoading } = useVerifiedGroups();

  const courseTypes = getCourseTypes();

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_type: "beginner",
    start_date: "",
    end_date: "",
    location: "",
    max_participants: 0,
    is_paid: false,
    is_public: true,
    contact_email: "",
    contact_phone: "",
    contact_url: "",
    group_id: "",
  });

  // Auto-select if only one group
  if (verifiedGroups.length === 1 && !form.group_id) {
    setForm(f => ({ ...f, group_id: verifiedGroups[0].id }));
  }

  const handleSubmit = async () => {
    if (!user || !form.title || !form.start_date || !form.end_date || !form.group_id) {
      toast({ title: t("fillRequiredFields"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: course, error } = await supabase
        .from("courses")
        .insert({
          title: form.title,
          description: form.description || null,
          course_type: form.course_type,
          start_date: form.start_date,
          end_date: form.end_date,
          location: form.location || null,
          max_participants: form.max_participants,
          is_paid: form.is_paid,
          is_public: form.is_public,
          creator_id: user.id,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          contact_url: form.contact_url || null,
          group_id: form.group_id,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast({ title: t("courseCreated") });
      navigate(`/courses/${course.id}`);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <header className="mb-6 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{t("createCourse")}</h1>
        </div>
      </header>

      <div className="space-y-5">
        {/* Group selector */}
        <div className="space-y-2">
          <Label>{t("selectGroup")} *</Label>
          {verifiedGroups.length === 0 && !groupsLoading ? (
            <p className="text-sm text-muted-foreground">{t("noVerifiedGroups")}</p>
          ) : (
            <Select value={form.group_id} onValueChange={v => setForm(f => ({ ...f, group_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectGroupPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {verifiedGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Course type */}
        <div className="space-y-2">
          <Label>{t("courseType")}</Label>
          <div className="flex gap-2 flex-wrap">
            {courseTypes.map(ct => (
              <button
                key={ct.value}
                onClick={() => setForm(f => ({ ...f, course_type: ct.value }))}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${form.course_type === ct.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-foreground border-border"}`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("courseTitle")}</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("coursePlaceholderTitle")} />
        </div>

        <div className="space-y-2">
          <Label>{t("courseDescription")}</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("coursePlaceholderDesc")} rows={4} />
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

        <div className="flex items-center justify-between">
          <Label>{t("paidSession")}</Label>
          <Switch checked={form.is_paid} onCheckedChange={v => setForm(f => ({ ...f, is_paid: v }))} />
        </div>

        {/* Contacts */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="font-semibold text-foreground">{t("contactInfo")}</h3>
          <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder={t("courseContactEmailPlaceholder")} type="email" />
          <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder={t("contactPhonePlaceholder")} type="tel" />
          <Input value={form.contact_url} onChange={e => setForm(f => ({ ...f, contact_url: e.target.value }))} placeholder={t("courseContactUrlPlaceholder")} type="url" />
        </div>

        <Button onClick={handleSubmit} disabled={loading || !form.group_id} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("createCourse")}
        </Button>
      </div>
    </AppLayout>
  );
};

export default CreateCourse;
