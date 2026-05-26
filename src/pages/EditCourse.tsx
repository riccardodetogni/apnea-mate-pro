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
import { t, getCourseTypes } from "@/lib/i18n";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { CoverImageUpload } from "@/components/ui/CoverImageUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EditCourse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { isInstructor } = useProfile();

  const courseTypes = getCourseTypes();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_type: "beginner",
    start_date: "",
    end_date: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    max_participants: 0,
    is_paid: false,
    is_public: true,
    contact_email: "",
    contact_phone: "",
    contact_url: "",
  });

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: c, error } = await supabase.from("courses").select("*").eq("id", id).single();
      if (error || !c) {
        toast({ title: t("error"), description: error?.message, variant: "destructive" });
        navigate(-1);
        return;
      }
      if (c.creator_id !== user.id) {
        toast({ title: t("error"), variant: "destructive" });
        navigate(`/courses/${id}`);
        return;
      }
      setForm({
        title: c.title || "",
        description: c.description || "",
        course_type: c.course_type || "beginner",
        start_date: c.start_date || "",
        end_date: c.end_date || "",
        location: c.location || "",
        latitude: c.latitude != null ? Number(c.latitude) : null,
        longitude: c.longitude != null ? Number(c.longitude) : null,
        max_participants: c.max_participants || 0,
        is_paid: !!c.is_paid,
        is_public: !!c.is_public,
        contact_email: c.contact_email || "",
        contact_phone: c.contact_phone || "",
        contact_url: c.contact_url || "",
      });
      setCoverUrl(c.cover_image_url ?? null);
      setFetching(false);
    })();
  }, [id, user]);

  const handleSubmit = async () => {
    if (!user || !id || !form.title || !form.start_date || !form.end_date) {
      toast({ title: t("fillRequiredFields"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("courses").update({
        title: form.title,
        description: form.description || null,
        course_type: form.course_type,
        start_date: form.start_date,
        end_date: form.end_date,
        location: form.location || null,
        latitude: form.latitude,
        longitude: form.longitude,
        max_participants: form.max_participants,
        is_paid: isInstructor ? form.is_paid : false,
        is_public: form.is_public,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        contact_url: form.contact_url || null,
        cover_image_url: coverUrl,
      }).eq("id", id);
      if (error) throw error;
      toast({ title: t("saveChanges") });
      navigate(`/courses/${id}`);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    setDeleting(true);
    try {
      await supabase.from("course_participants").delete().eq("course_id", id);
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: t("courseDeleted") });
      navigate("/community");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
      setDeleting(false);
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
        {user && (
          <CoverImageUpload
            currentUrl={coverUrl}
            uploadPath={user.id}
            entity="course"
            onChange={setCoverUrl}
          />
        )}

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
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>{t("courseDescription")}</Label>
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
          <LocationAutocomplete
            value={form.location}
            onChange={val => setForm(f => ({ ...f, location: val }))}
            onCoordinatesChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
          />
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

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveChanges")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={deleting} className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? t("deleting") : t("deleteCourse")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirmDeleteCourseTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("confirmDeleteCourseDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default EditCourse;