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
import { ArrowLeft, Calendar, MapPin, Users, Loader2, UserPlus, UserMinus, Clock, Share2, Ticket, Trophy, Compass, MessageCircle } from "lucide-react";
import { getOrCreateEventConversation } from "@/hooks/useConversations";

interface EventScheduleItem {
  id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
}

const eventTypeConfig: Record<string, { label: string; icon: typeof Ticket; color: string }> = {
  stage: { label: "Stage", icon: Ticket, color: "bg-purple-500/20 text-purple-400" },
  competition: { label: "Gara", icon: Trophy, color: "bg-red-500/20 text-red-400" },
  trip: { label: "Trip", icon: Compass, color: "bg-blue-500/20 text-blue-400" },
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
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

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
      setParticipantCount(confirmed);
      const myStatus = participantsRes.data?.find(p => p.user_id === user?.id)?.status || null;
      setUserStatus(myStatus);
      setLoading(false);
    };
    fetchEvent();
  }, [id, user?.id]);

  const handleJoin = async () => {
    if (!user || !id) return;
    setJoining(true);
    const { error } = await supabase.from("event_participants").insert({ event_id: id, user_id: user.id, status: "pending" });
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
    await supabase.from("event_participants").delete().eq("event_id", id).eq("user_id", user.id);
    setUserStatus(null);
    toast({ title: "Iscrizione annullata" });
    setJoining(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event?.title, url: window.location.href });
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

  if (!event) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted">Evento non trovato</p>
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
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" /> Condividi
        </Button>
      </div>

      {/* Hero */}
      <div className="card-session !p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full ${config.color}`}>
            <Icon className="w-3 h-3" /> {config.label}
          </span>
          {event.is_paid && <span className="badge-level">💰 A pagamento</span>}
        </div>
        <h1 className="text-xl font-bold text-card-foreground mb-2">{event.title}</h1>
        <div className="space-y-1.5 text-sm text-[hsl(var(--card-soft))]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(start, "d MMM", { locale: it })} – {format(end, "d MMM yyyy", { locale: it })} · {days} giorni
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {event.location}
            </div>
          )}
          {event.max_participants > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {participantCount}/{event.max_participants} iscritti
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
                  <span className="text-xs font-medium text-primary">Giorno {day.day_number}</span>
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
          <span className="font-medium text-foreground">{creatorProfile?.name || "Utente"}</span>
        </button>
      </div>
    </AppLayout>
  );
};

export default EventDetails;
