import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSpotDetails } from "@/hooks/useSpotDetails";
import { useSpotFavorites } from "@/hooks/useSpotFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityContext } from "@/hooks/useCommunityContext";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotMiniMap } from "@/components/spots/SpotMiniMap";
import { SafetyWarningModal } from "@/components/community/SafetyWarningModal";
import { t } from "@/lib/i18n";
import { ArrowLeft, Heart, Navigation, MapPin, Waves, Calendar, Users, Clock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow } from "date-fns";
import { it } from "date-fns/locale";

const environmentIcons: Record<string, string> = {
  sea: "🌊",
  lake: "🏞️",
  pool: "🏊",
  deep_pool: "🏊‍♂️",
};

const environmentLabels: Record<string, string> = {
  sea: "sea",
  lake: "lake",
  pool: "pool",
  deep_pool: "deepPool",
};

const SpotDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string })?.from || "/spots";
  const { user } = useAuth();
  const { canJoinSession, isCertified } = useCommunityContext();
  const { spot, sessions, loading, error, refetch } = useSpotDetails(id);
  const { isFavorite, toggleFavorite } = useSpotFavorites();

  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingJoinSession, setPendingJoinSession] = useState<{ id: string; level: string; title: string; creator_id: string } | null>(null);

  const handleFavoriteToggle = () => {
    if (!user) {
      toast.error("Accedi per salvare i preferiti");
      return;
    }
    if (spot) {
      const wasFavorite = isFavorite(spot.id);
      toggleFavorite(spot.id);
      toast.success(wasFavorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti");
    }
  };

  const getDirectionsUrl = () => {
    if (spot?.latitude && spot?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    }
    return null;
  };

  const handleJoinClick = (session: { id: string; level: string; title: string; creator_id: string }) => {
    if (!user) {
      toast.error("Accedi per partecipare");
      return;
    }
    setPendingJoinSession(session);
    setSafetyModalOpen(true);
  };

  const confirmJoin = async () => {
    if (!pendingJoinSession || !user) return;

    setJoiningSessionId(pendingJoinSession.id);
    setSafetyModalOpen(false);

    const { error: joinError } = await supabase
      .from("session_participants")
      .insert({
        session_id: pendingJoinSession.id,
        user_id: user.id,
        status: "pending",
      });

    if (joinError) {
      if (joinError.message?.includes("duplicate")) {
        toast.error("Hai già inviato una richiesta per questa sessione");
      } else if (joinError.message?.includes("session_full")) {
        toast.error("Non ci sono più posti disponibili");
      } else {
        toast.error(joinError.message || "Impossibile inviare la richiesta");
      }
    } else {
      toast.success("Richiesta inviata! L'organizzatore riceverà la tua richiesta");

      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      await createNotification({
        userId: pendingJoinSession.creator_id,
        type: "session_join_request",
        title: "Nuova richiesta di partecipazione",
        message: `${userProfile?.name || "Un utente"} vuole partecipare a "${pendingJoinSession.title}"`,
        metadata: {
          session_id: pendingJoinSession.id,
          session_title: pendingJoinSession.title,
          user_id: user.id,
          user_name: userProfile?.name || undefined,
        },
      });

      try {
        await supabase.functions.invoke("send-session-notification", {
          body: {
            type: "join_request",
            sessionId: pendingJoinSession.id,
            participantUserId: user.id,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }

      refetch();
    }

    setJoiningSessionId(null);
    setPendingJoinSession(null);
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Oggi, ${format(date, "HH:mm")}`;
    if (isTomorrow(date)) return `${t("tomorrow")}, ${format(date, "HH:mm")}`;
    return format(date, "EEE d MMM, HH:mm", { locale: it });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !spot) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted">{t("error")}</p>
          <Button variant="outline" onClick={() => navigate("/spots")} className="mt-4">
            {t("back")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const spotIsFavorite = isFavorite(spot.id);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(backPath)}
          className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground flex-1 truncate">
          {t("spotDetails")}
        </h1>
      </div>

      {/* Hero section */}
      <div className="bg-card rounded-2xl border border-white/8 p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
            {environmentIcons[spot.environment_type] || "📍"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-card-foreground mb-1">{spot.name}</h2>
            <div className="flex items-center gap-1.5 text-white/55 text-sm mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{spot.location}</span>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-primary text-xs font-medium">
                <Waves className="w-3 h-3" />
                {t(environmentLabels[spot.environment_type] as any) || spot.environment_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {spot.description && (
        <div className="bg-card rounded-xl border border-white/8 p-4 mb-4">
          <p className="text-sm text-white/55 leading-relaxed">{spot.description}</p>
        </div>
      )}

      {/* Mini map */}
      {spot.latitude && spot.longitude && (
        <a 
          href={getDirectionsUrl() || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden border mb-4"
        >
          <SpotMiniMap 
            latitude={spot.latitude} 
            longitude={spot.longitude} 
            className="h-40 w-full cursor-pointer" 
          />
        </a>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={spotIsFavorite ? "default" : "outline"}
          className="flex-1 gap-2"
          onClick={handleFavoriteToggle}
        >
          <Heart className={`w-4 h-4 ${spotIsFavorite ? "fill-current" : ""}`} />
          {spotIsFavorite ? "Preferito" : t("addToFavorites")}
        </Button>
        {spot.latitude && spot.longitude && getDirectionsUrl() && (
          <Button variant="outline" className="flex-1 gap-2" asChild>
            <a href={getDirectionsUrl()!} target="_blank" rel="noopener noreferrer">
              <Navigation className="w-4 h-4" />
              {t("getDirections")}
            </a>
          </Button>
        )}
      </div>

      {/* Sessions at this spot */}
      <div className="space-y-3 pb-6">
        <h3 className="text-base font-semibold text-foreground">{t("sessionsAtSpot")}</h3>
        
        {sessions.length === 0 ? (
          <div className="bg-card rounded-xl border border-white/8 p-6 text-center">
            <Calendar className="w-8 h-8 text-white/55 mx-auto mb-2" />
            <p className="text-sm text-white/55">{t("noSessionsAtSpot")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isFull = session.current_participants >= session.max_participants;
              const isCreator = user?.id === session.creator_id;
              const canShow = !isCreator && session.myStatus === "none" && !isFull;

              return (
                <div
                  key={session.id}
                  className="bg-card rounded-xl border border-white/8 p-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    navigate(`/sessions/${session.id}`, { state: { from: `/spots/${id}` } });
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/55 mb-1">{formatSessionDate(session.date_time)}</p>
                      <h4 className="font-medium text-card-foreground mb-1.5 truncate">{session.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-white/55">
                        <span className="badge-level">{t(session.level as any)}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {session.current_participants}/{session.max_participants}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Join / Status button */}
                      {session.myStatus === "confirmed" ? (
                        <Button
                          variant="pill"
                          size="pill"
                          className="text-xs bg-success/10 text-success border-success/30"
                          onClick={() => navigate(`/sessions/${session.id}`, { state: { from: `/spots/${id}` } })}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Iscritto
                        </Button>
                      ) : session.myStatus === "pending" ? (
                        <Button
                          variant="pillOutline"
                          size="pill"
                          className="text-xs bg-warning/10 text-warning border-warning/30"
                          onClick={() => navigate(`/sessions/${session.id}`, { state: { from: `/spots/${id}` } })}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          In attesa
                        </Button>
                      ) : canShow ? (
                        <Button
                          variant="pill"
                          size="pill"
                          className="text-xs"
                          disabled={joiningSessionId === session.id}
                          onClick={() => handleJoinClick({
                            id: session.id,
                            level: session.level,
                            title: session.title,
                            creator_id: session.creator_id,
                          })}
                        >
                          {joiningSessionId === session.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            t("join")
                          )}
                        </Button>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden">
                          {session.creator.avatar_url ? (
                            <img
                              src={session.creator.avatar_url}
                              alt={session.creator.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            session.creator.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Warning Modal */}
      <SafetyWarningModal
        open={safetyModalOpen}
        onClose={() => {
          setSafetyModalOpen(false);
          setPendingJoinSession(null);
        }}
        onConfirm={confirmJoin}
        sessionTitle={pendingJoinSession?.title || ""}
        sessionLevel={pendingJoinSession?.level || "beginner"}
        userCertified={isCertified}
        loading={joiningSessionId !== null}
      />
    </AppLayout>
  );
};

export default SpotDetails;
