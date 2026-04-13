import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ContactInfo } from "@/components/events/ContactInfo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Calendar, MapPin, Users, Loader2, UserPlus, UserMinus, Clock, Share2, GraduationCap } from "lucide-react";

const courseTypeLabels: Record<string, string> = {
  beginner: "Base",
  advanced: "Avanzato",
  instructor: "Istruttore",
  specialty: "Specialità",
};

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      setLoading(true);
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);

      const [profileRes, participantsRes] = await Promise.all([
        supabase.from("profiles").select("name, avatar_url").eq("user_id", courseData.creator_id).single(),
        supabase.from("course_participants").select("user_id, status").eq("course_id", id).in("status", ["pending", "confirmed"]),
      ]);

      setCreatorProfile(profileRes.data);
      setParticipantCount(participantsRes.data?.filter(p => p.status === "confirmed").length || 0);
      setUserStatus(participantsRes.data?.find(p => p.user_id === user?.id)?.status || null);
      setLoading(false);
    };
    fetchCourse();
  }, [id, user?.id]);

  const handleJoin = async () => {
    if (!user || !id) return;
    setJoining(true);
    const { error } = await supabase.from("course_participants").insert({ course_id: id, user_id: user.id, status: "pending" });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setUserStatus("pending");
      toast({ title: "Richiesta inviata!" });
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || !id) return;
    setJoining(true);
    await supabase.from("course_participants").delete().eq("course_id", id).eq("user_id", user.id);
    setUserStatus(null);
    toast({ title: "Iscrizione annullata" });
    setJoining(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: course?.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiato!" });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted">Corso non trovato</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">{t("back")}</Button>
        </div>
      </AppLayout>
    );
  }

  const start = new Date(course.start_date);
  const end = new Date(course.end_date);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" /> Condividi
        </Button>
      </div>

      {/* Hero */}
      <div className="card-session !p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300">
            <GraduationCap className="w-3 h-3" /> {courseTypeLabels[course.course_type] || course.course_type}
          </span>
          {course.is_paid && <span className="badge-level">💰 A pagamento</span>}
        </div>
        <h1 className="text-xl font-bold text-card-foreground mb-2">{course.title}</h1>
        <div className="space-y-1.5 text-sm text-[hsl(var(--card-soft))]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(start, "d MMM", { locale: it })} – {format(end, "d MMM yyyy", { locale: it })}
          </div>
          {course.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {course.location}
            </div>
          )}
          {course.max_participants > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {participantCount}/{course.max_participants} iscritti
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        {user && !userStatus && (
          <Button onClick={handleJoin} disabled={joining} className="flex-1 gap-2">
            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Richiedi iscrizione
          </Button>
        )}
        {userStatus === "pending" && (
          <Button onClick={handleLeave} disabled={joining} variant="outline" className="flex-1 gap-2">
            <Clock className="w-4 h-4" /> Annulla richiesta
          </Button>
        )}
        {userStatus === "confirmed" && (
          <Button onClick={handleLeave} disabled={joining} variant="outline" className="flex-1 gap-2">
            <UserMinus className="w-4 h-4" /> Annulla iscrizione
          </Button>
        )}
      </div>

      {/* Description */}
      {course.description && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">{t("courseDescription")}</h3>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{course.description}</p>
        </div>
      )}

      {/* Contact */}
      {(course.contact_email || course.contact_phone || course.contact_url) && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">{t("contactInfo")}</h3>
          <ContactInfo email={course.contact_email} phone={course.contact_phone} url={course.contact_url} />
        </div>
      )}

      {/* Creator */}
      <div className="mb-6 pb-6">
        <h3 className="text-base font-semibold text-foreground mb-2">{t("organizer")}</h3>
        <button
          onClick={() => navigate(`/users/${course.creator_id}`)}
          className="flex items-center gap-3 p-3 bg-secondary rounded-xl w-full text-left"
        >
          <div className="avatar-user">
            {creatorProfile?.avatar_url ? (
              <img src={creatorProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
            ) : (
              (creatorProfile?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium text-foreground">{creatorProfile?.name || "Utente"}</span>
        </button>
      </div>
    </AppLayout>
  );
};

export default CourseDetails;
