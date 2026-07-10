import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ContactInfo } from "@/components/events/ContactInfo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { fullName } from "@/lib/format";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Calendar, MapPin, Users, Loader2, UserPlus, UserMinus, Clock, Share2, GraduationCap, Pencil, Check, X, MoreVertical, Trash2, MessageCircle } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { ContactOrganiserSheet } from "@/components/chat/ContactOrganiserSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

const courseTypeKeys: Record<string, string> = {
  beginner: "courseTypeBeginner",
  advanced: "courseTypeAdvanced",
  instructor: "courseTypeInstructor",
  specialty: "courseTypeSpecialty",
};

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [reservedCount, setReservedCount] = useState(0);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [participants, setParticipants] = useState<Array<{ id: string; user_id: string; status: string; profile: { name: string | null; last_name: string | null; avatar_url: string | null } | null }>>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);

  const isCreator = !!user && !!course && user.id === course.creator_id;

  const loadParticipants = async (courseId: string) => {
    const { data } = await supabase
      .from("course_participants")
      .select("id, user_id, status")
      .eq("course_id", courseId)
      .in("status", ["pending", "confirmed"]);
    if (!data || data.length === 0) {
      setParticipants([]);
      return;
    }
    const userIds = [...new Set(data.map((p) => p.user_id))];
    const { data: profilesData } = await supabase.from("profiles").select("user_id, name, last_name, avatar_url").in("user_id", userIds);
    const profileMap = new Map<string, { name: string | null; last_name: string | null; avatar_url: string | null }>();
    profilesData?.forEach((p) => profileMap.set(p.user_id, { name: p.name, last_name: p.last_name, avatar_url: p.avatar_url }));
    setParticipants(data.map((p) => ({ ...p, profile: profileMap.get(p.user_id) || null })));

  };

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      setLoading(true);
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);

      const [profileRes, participantsRes] = await Promise.all([
        supabase.from("profiles").select("name, last_name, avatar_url").eq("user_id", courseData.creator_id).single(),
        supabase.from("course_participants").select("user_id, status").eq("course_id", id).in("status", ["pending", "confirmed"]),
      ]);

      setCreatorProfile(profileRes.data);
      setParticipantCount(participantsRes.data?.filter(p => p.status === "confirmed").length || 0);
      setReservedCount(participantsRes.data?.length || 0);
      setUserStatus(participantsRes.data?.find(p => p.user_id === user?.id)?.status || null);
      if (user?.id === courseData.creator_id) {
        await loadParticipants(id);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [id, user?.id]);

  const handleJoin = async () => {
    if (!user || !id) return;
    if (course?.max_participants > 0 && reservedCount >= course.max_participants) {
      toast({ title: t("courseFull"), description: t("courseFullDesc"), variant: "destructive" });
      return;
    }
    setJoining(true);
    const { error } = await supabase.rpc("rejoin_course", { _course_id: id });
    if (error) {
      if (error.message?.includes("course_full")) {
        toast({ title: t("courseFull"), description: t("courseFullDesc"), variant: "destructive" });
      } else {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      }
    } else {
      setUserStatus("pending");
      setReservedCount(c => c + 1);
      toast({ title: t("requestSent") });

      // In-app notification to organizer
      const { data: requesterProfile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
      await createNotification({
        userId: course.creator_id,
        type: "course_join_request",
        title: t("notifJoinRequestTitle"),
        message: t("notifJoinRequestMsg")
          .replace("{name}", requesterProfile?.name || t("aFreediver"))
          .replace("{title}", course.title),
        metadata: {
          course_id: id,
          course_title: course.title,
          user_id: user.id,
          user_name: requesterProfile?.name || undefined,
        },
      });

      // Email
      try {
        await supabase.functions.invoke("send-course-notification", {
          body: { type: "join_request", courseId: id, participantUserId: user.id },
        });
      } catch (e) {
        console.error("Failed to send course notification:", e);
      }
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || !id) return;
    setJoining(true);
    const { data, error } = await supabase
      .from("course_participants")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: user.id })
      .eq("course_id", id)
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .select("id");
    setJoining(false);
    if (error || !data || data.length === 0) {
      toast({ title: t("error"), description: error?.message || t("cannotCancelParticipation"), variant: "destructive" });
      return;
    }
    setUserStatus(null);
    setReservedCount(c => Math.max(0, c - 1));
    toast({ title: t("registrationCancelled") });
  };

  const handleApprove = async (participantId: string, participantUserId: string) => {
    if (!id || !course) return;
    setActionLoading(participantId);
    const { error } = await supabase
      .from("course_participants")
      .update({ status: "confirmed" })
      .eq("id", participantId);
    setActionLoading(null);
    if (error) {
      toast({ title: t("error"), description: t("cannotApprove"), variant: "destructive" });
      return;
    }
    toast({ title: t("approvedTitle"), description: t("approvedDesc") });
    setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, status: "confirmed" } : p)));
    setParticipantCount((c) => c + 1);

    await createNotification({
      userId: participantUserId,
      type: "course_request_approved",
      title: t("notifApprovedTitle"),
      message: t("notifApprovedMsg").replace("{title}", course.title),
      metadata: { course_id: id, course_title: course.title },
    });
    try {
      await supabase.functions.invoke("send-course-notification", {
        body: { type: "request_approved", courseId: id, participantUserId },
      });
    } catch (e) {
      console.error("Failed to send course notification:", e);
    }
  };

  const handleReject = async (participantId: string, participantUserId: string) => {
    if (!id || !course) return;
    setActionLoading(participantId);
    const { error } = await supabase.from("course_participants").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: user?.id ?? null }).eq("id", participantId);
    setActionLoading(null);
    if (error) {
      toast({ title: t("error"), description: t("cannotReject"), variant: "destructive" });
      return;
    }
    toast({ title: t("rejectedTitle"), description: t("rejectedDesc") });
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    setReservedCount((c) => Math.max(0, c - 1));

    await createNotification({
      userId: participantUserId,
      type: "course_request_rejected",
      title: t("notifRejectedTitle"),
      message: t("notifRejectedMsg").replace("{title}", course.title),
      metadata: { course_id: id, course_title: course.title },
    });
    try {
      await supabase.functions.invoke("send-course-notification", {
        body: { type: "request_rejected", courseId: id, participantUserId },
      });
    } catch (e) {
      console.error("Failed to send course notification:", e);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: course?.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t("linkCopied") });
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || !id) return;
    setDeleting(true);
    const snapshot = participants.map((p) => p.user_id);
    const { data, error } = await supabase.rpc("delete_course_cascade", { _course_id: id });
    setDeleting(false);
    if (error) {
      const isPerm = error.message?.includes("insufficient_privilege");
      toast({
        title: "Errore",
        description: isPerm
          ? "Non hai i permessi per eliminare questo contenuto."
          : "Impossibile eliminare. Riprova più tardi.",
        variant: "destructive",
      });
      return;
    }
    setDeleteDialogOpen(false);
    const recipients = (data as Array<{ user_id: string }> | null)?.map((r) => r.user_id) ?? snapshot;
    for (const uid of recipients) {
      await createNotification({
        userId: uid,
        type: "course_cancelled",
        title: "Corso eliminato",
        message: `Il corso "${course.title}" è stato eliminato dall'organizzatore`,
        metadata: { course_id: course.id, course_title: course.title },
      });
    }
    toast({ title: "Corso eliminato" });
    navigate("/community");
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
          <p className="text-muted">{t("courseNotFound")}</p>
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
        {user && course && user.id === course.creator_id && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${id}/edit`)} className="gap-2">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" /> {t("share")}
        </Button>
        {isCreator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Altre azioni">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Hero */}
      <div className="card-session !p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300">
            <GraduationCap className="w-3 h-3" /> {t((courseTypeKeys[course.course_type] || "courseTypeBeginner") as any)}
          </span>
          {course.is_paid && <span className="badge-level">💰 {t("paidSession")}</span>}
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
              {participantCount}/{course.max_participants} {t("enrolled")}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        {user && !userStatus && (() => {
          const isFull = course.max_participants > 0 && reservedCount >= course.max_participants;
          return (
            <Button onClick={handleJoin} disabled={joining || isFull} className="flex-1 gap-2">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isFull ? t("courseFull") : t("requestRegistration")}
            </Button>
          );
        })()}
        {userStatus === "pending" && (
          <Button onClick={handleLeave} disabled={joining} variant="outline" className="flex-1 gap-2">
            <Clock className="w-4 h-4" /> {t("cancelRequest")}
          </Button>
        )}
        {userStatus === "confirmed" && (
          <Button onClick={handleLeave} disabled={joining} variant="outline" className="flex-1 gap-2">
            <UserMinus className="w-4 h-4" /> {t("cancelRegistration")}
          </Button>
        )}
      </div>
      {user && !isCreator && (
        <Button
          variant="outline"
          className="w-full mb-4 gap-2"
          onClick={() => setContactSheetOpen(true)}
        >
          <MessageCircle className="w-4 h-4" />
          Chiedi informazioni
        </Button>
      )}

      {/* Cover image */}
      {course.cover_image_url && (
        <div className="mb-4 rounded-2xl overflow-hidden">
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

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
          <span className="font-medium text-foreground">{fullName(creatorProfile, t("user"))}</span>
        </button>
      </div>

      {/* Participants management (creator) */}
      {isCreator && (
        <div className="space-y-4 mb-6">
          {participants.filter((p) => p.status === "pending").length > 0 && (
            <div className="card-session !rounded-2xl !p-4">
              <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-sm">
                  {participants.filter((p) => p.status === "pending").length}
                </span>
                {t("pendingRequests")}
              </h3>
              <div className="space-y-2">
                {participants.filter((p) => p.status === "pending").map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-[hsl(var(--badge-blue-bg))]">
                    {p.profile?.avatar_url ? (
                      <img src={p.profile.avatar_url} alt={p.profile.name || ""} className="w-8 h-8 rounded-full object-cover cursor-pointer" onClick={() => navigate(`/users/${p.user_id}`)} />
                    ) : (
                      <div className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center text-sm font-medium text-white cursor-pointer" onClick={() => navigate(`/users/${p.user_id}`)}>
                        {p.profile?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="flex-1 text-sm text-card-foreground cursor-pointer" onClick={() => navigate(`/users/${p.user_id}`)}>
                      {fullName(p.profile, t("user"))}

                    </span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/20" onClick={() => handleApprove(p.id, p.user_id)} disabled={!!actionLoading}>
                        {actionLoading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={() => handleReject(p.id, p.user_id)} disabled={!!actionLoading}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-session !rounded-2xl !p-4">
            <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-sm">
                {participants.filter((p) => p.status === "confirmed").length}
              </span>
              {t("confirmedParticipants")}
            </h3>
            {participants.filter((p) => p.status === "confirmed").length > 0 ? (
              <div className="space-y-2">
                {participants.filter((p) => p.status === "confirmed").map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-[hsl(var(--badge-blue-bg))]">
                    {p.profile?.avatar_url ? (
                      <img src={p.profile.avatar_url} alt={p.profile.name || ""} className="w-8 h-8 rounded-full object-cover cursor-pointer" onClick={() => navigate(`/users/${p.user_id}`)} />
                    ) : (
                      <div className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center text-sm font-medium text-white cursor-pointer" onClick={() => navigate(`/users/${p.user_id}`)}>
                        {p.profile?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="flex-1 text-sm text-card-foreground cursor-pointer" onClick={() => navigate(`/users/${p.user_id}`)}>
                      {fullName(p.profile, t("user"))}
                    </span>
                    <Check className="w-4 h-4 text-success" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--card-muted))]">{t("noConfirmedParticipants")}</p>
            )}
          </div>
        </div>
      )}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina corso"
        description="Sei sicuro di voler eliminare questo corso? I partecipanti iscritti verranno notificati. Questa azione è irreversibile."
        loading={deleting}
        onConfirm={handleDeleteCourse}
      />
      {!isCreator && (
        <ContactOrganiserSheet
          open={contactSheetOpen}
          onOpenChange={setContactSheetOpen}
          organiserId={course.creator_id}
          organiserName={fullName(creatorProfile, "Organizzatore")}
          organiserAvatarUrl={creatorProfile?.avatar_url}
          entityType="course"
          entityTitle={course.title}
        />
      )}
    </AppLayout>
  );
};

export default CourseDetails;
