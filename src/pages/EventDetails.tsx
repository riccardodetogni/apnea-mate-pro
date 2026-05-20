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
import { ArrowLeft, Calendar, MapPin, Users, Loader2, UserPlus, UserMinus, Clock, Share2, Ticket, Trophy, Compass, MessageCircle, Pencil, Check, X } from "lucide-react";
import { getOrCreateEventConversation } from "@/hooks/useConversations";
import { createNotification } from "@/lib/notifications";

interface EventScheduleItem {
  id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
}

const eventTypeConfig: Record<string, { labelKey: string; icon: typeof Ticket; color: string }> = {
  stage: { labelKey: "eventTypeStage", icon: Ticket, color: "bg-purple-500/20 text-purple-400" },
  competition: { labelKey: "eventTypeCompetition", icon: Trophy, color: "bg-red-500/20 text-red-400" },
  trip: { labelKey: "eventTypeTrip", icon: Compass, color: "bg-blue-500/20 text-blue-400" },
};

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [schedule, setSchedule] = useState<EventScheduleItem[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [reservedCount, setReservedCount] = useState(0);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [participants, setParticipants] = useState<Array<{ id: string; user_id: string; status: string; profile: { name: string | null; avatar_url: string | null } | null }>>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isCreator = !!user && !!event && user.id === event.creator_id;

  const loadParticipants = async (eventId: string) => {
    const { data } = await supabase
      .from("event_participants")
      .select("id, user_id, status")
      .eq("event_id", eventId)
      .in("status", ["pending", "confirmed"]);
    if (!data || data.length === 0) {
      setParticipants([]);
      return;
    }
    const userIds = [...new Set(data.map((p) => p.user_id))];
    const { data: profilesData } = await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", userIds);
    const profileMap = new Map<string, { name: string | null; avatar_url: string | null }>();
    profilesData?.forEach((p) => profileMap.set(p.user_id, { name: p.name, avatar_url: p.avatar_url }));
    setParticipants(data.map((p) => ({ ...p, profile: profileMap.get(p.user_id) || null })));
  };

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setLoading(true);
      const { data: eventData } = await supabase.from("events").select("*").eq("id", id).single();
      if (!eventData) { setLoading(false); return; }
      setEvent(eventData);

      const [profileRes, scheduleRes, participantsRes] = await Promise.all([
        supabase.from("profiles").select("name, avatar_url").eq("user_id", eventData.creator_id).single(),
        supabase.from("event_schedule").select("*").eq("event_id", id).order("day_number"),
        supabase.from("event_participants").select("user_id, status").eq("event_id", id).in("status", ["pending", "confirmed"]),
      ]);

      setCreatorProfile(profileRes.data);
      setSchedule(scheduleRes.data || []);
      const confirmed = participantsRes.data?.filter(p => p.status === "confirmed").length || 0;
      const reserved = participantsRes.data?.length || 0;
      setParticipantCount(confirmed);
      setReservedCount(reserved);
      const myStatus = participantsRes.data?.find(p => p.user_id === user?.id)?.status || null;
      setUserStatus(myStatus);
      if (user?.id === eventData.creator_id) {
        await loadParticipants(id);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id, user?.id]);

  const handleJoin = async () => {
    if (!user || !id) return;
    if (event?.max_participants > 0 && reservedCount >= event.max_participants) {
      toast({ title: t("eventFull"), description: t("eventFullDesc"), variant: "destructive" });
      return;
    }
    setJoining(true);
    const { error } = await supabase.from("event_participants").insert({ event_id: id, user_id: user.id, status: "pending" });
    if (error) {
      if (error.message?.includes("event_full")) {
        toast({ title: t("eventFull"), description: t("eventFullDesc"), variant: "destructive" });
      } else {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      }
    } else {
      setUserStatus("pending");
      setReservedCount(c => c + 1);
      toast({ title: t("requestSent") });

      const { data: requesterProfile } = await supabase.from("profiles").select("name").eq("user_id", user.id).single();
      await createNotification({
        userId: event.creator_id,
        type: "event_join_request",
        title: "Nuova richiesta di iscrizione",
        message: `${requesterProfile?.name || "Un freediver"} vuole iscriversi a "${event.title}"`,
        metadata: {
          event_id: id,
          event_title: event.title,
          user_id: user.id,
          user_name: requesterProfile?.name || undefined,
        },
      });

      try {
        await supabase.functions.invoke("send-event-notification", {
          body: { type: "join_request", eventId: id, participantUserId: user.id },
        });
      } catch (e) {
        console.error("Failed to send event notification:", e);
      }
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || !id) return;
    setJoining(true);
    await supabase.from("event_participants").delete().eq("event_id", id).eq("user_id", user.id);
    setUserStatus(null);
    toast({ title: t("registrationCancelled") });
    setJoining(false);
  };

  const handleApprove = async (participantId: string, participantUserId: string) => {
    if (!id || !event) return;
    setActionLoading(participantId);
    const { error } = await supabase
      .from("event_participants")
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
      type: "event_request_approved",
      title: "Iscrizione approvata!",
      message: `La tua iscrizione a "${event.title}" è stata confermata`,
      metadata: { event_id: id, event_title: event.title },
    });
    try {
      await supabase.functions.invoke("send-event-notification", {
        body: { type: "request_approved", eventId: id, participantUserId },
      });
    } catch (e) {
      console.error("Failed to send event notification:", e);
    }
  };

  const handleReject = async (participantId: string, participantUserId: string) => {
    if (!id || !event) return;
    setActionLoading(participantId);
    const { error } = await supabase.from("event_participants").delete().eq("id", participantId);
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
      type: "event_request_rejected",
      title: "Iscrizione non approvata",
      message: `La tua richiesta per "${event.title}" non è stata accettata`,
      metadata: { event_id: id, event_title: event.title },
    });
    try {
      await supabase.functions.invoke("send-event-notification", {
        body: { type: "request_rejected", eventId: id, participantUserId },
      });
    } catch (e) {
      console.error("Failed to send event notification:", e);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event?.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t("linkCopied") });
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

  if (!event) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted">{t("eventNotFound")}</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">{t("back")}</Button>
        </div>
      </AppLayout>
    );
  }

  const config = eventTypeConfig[event.event_type] || eventTypeConfig.stage;
  const Icon = config.icon;
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1" />
        {user && event && user.id === event.creator_id && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/edit`)} className="gap-2">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" /> {t("share")}
        </Button>
      </div>

      {/* Hero */}
      <div className="card-session !p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full ${config.color}`}>
            <Icon className="w-3 h-3" /> {t(config.labelKey as any)}
          </span>
          {event.is_paid && <span className="badge-level">💰 {t("paidSession")}</span>}
        </div>
        <h1 className="text-xl font-bold text-card-foreground mb-2">{event.title}</h1>
        <div className="space-y-1.5 text-sm text-[hsl(var(--card-soft))]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(start, "d MMM", { locale: it })} – {format(end, "d MMM yyyy", { locale: it })} · {days} {t("days")}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {event.location}
            </div>
          )}
          {event.max_participants > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {participantCount}/{event.max_participants} {t("enrolled")}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        {user && !userStatus && (() => {
          const isFull = event.max_participants > 0 && reservedCount >= event.max_participants;
          return (
            <Button onClick={handleJoin} disabled={joining || isFull} className="flex-1 gap-2">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isFull ? t("eventFull") : t("requestRegistration")}
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
        {user && (userStatus === "confirmed" || user.id === event.creator_id) && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              try {
                const convId = await getOrCreateEventConversation(event.id, user.id);
                navigate(`/messages/${convId}`);
              } catch {
                toast({ title: t("error"), description: t("cannotOpenChat"), variant: "destructive" });
              }
            }}
          >
            <MessageCircle className="w-4 h-4" /> Chat
          </Button>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">{t("eventDescription")}</h3>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Contact */}
      {(event.contact_email || event.contact_phone || event.contact_url) && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">{t("contactInfo")}</h3>
          <ContactInfo email={event.contact_email} phone={event.contact_phone} url={event.contact_url} />
        </div>
      )}

      {/* Schedule */}
      {schedule.length > 0 && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">{t("eventSchedule")}</h3>
          <div className="space-y-2">
            {schedule.map(day => (
              <div key={day.id} className="p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{t("dayLabel")} {day.day_number}</span>
                  {day.start_time && day.end_time && (
                    <span className="text-xs text-muted">{day.start_time} – {day.end_time}</span>
                  )}
                </div>
                {day.title && <p className="text-sm font-medium text-foreground">{day.title}</p>}
                {day.description && <p className="text-xs text-muted mt-0.5">{day.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creator */}
      <div className="mb-6 pb-6">
        <h3 className="text-base font-semibold text-foreground mb-2">{t("organizer")}</h3>
        <button
          onClick={() => navigate(`/users/${event.creator_id}`)}
          className="flex items-center gap-3 p-3 bg-secondary rounded-xl w-full text-left"
        >
          <div className="avatar-user">
            {creatorProfile?.avatar_url ? (
              <img src={creatorProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
            ) : (
              (creatorProfile?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium text-foreground">{creatorProfile?.name || t("user")}</span>
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
                      {p.profile?.name || t("user")}
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
                      {p.profile?.name || t("user")}
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
    </AppLayout>
  );
};

export default EventDetails;
