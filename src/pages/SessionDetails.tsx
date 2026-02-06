import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityContext } from "@/hooks/useCommunityContext";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n";
import { createNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SafetyWarningModal } from "@/components/community/SafetyWarningModal";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Award,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("it-IT", options);
};

const mapLevel = (level: string): string => {
  switch (level) {
    case "beginner": return "Principiante";
    case "intermediate": return "Intermedio";
    case "advanced": return "Avanzato";
    case "all_levels": return "Tutti i livelli";
    default: return level;
  }
};

const mapSessionType = (type: string): string => {
  switch (type) {
    case "sea_trip": return "Uscita mare";
    case "pool_session": return "Piscina";
    case "deep_pool_session": return "Piscina profonda";
    case "lake_trip": return "Uscita lago";
    case "training": return "Allenamento";
    default: return type;
  }
};

const SessionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string })?.from || "/community";
  const { user } = useAuth();
  const { toast } = useToast();
  const { isCertified, canJoinSession } = useCommunityContext();

  const { session, loading, approveParticipant, rejectParticipant, cancelSession } = useSessionDetails(id);

  const [joining, setJoining] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleJoinRequest = () => {
    if (!session) return;
    const { requiresWarning } = canJoinSession(session.level);
    // Always show safety modal
    setSafetyModalOpen(true);
  };

  const confirmJoin = async () => {
    if (!session || !user) return;

    setJoining(true);
    setSafetyModalOpen(false);

    const { error } = await supabase
      .from("session_participants")
      .insert({
        session_id: session.id,
        user_id: user.id,
        status: "pending",
      });

    setJoining(false);

    if (error) {
      if (error.message?.includes("duplicate")) {
        toast({
          title: "Già richiesto",
          description: "Hai già inviato una richiesta per questa sessione",
          variant: "destructive",
        });
      } else if (error.message?.includes("session_full")) {
        toast({
          title: "Sessione piena",
          description: "Non ci sono più posti disponibili",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: error.message || "Impossibile inviare la richiesta",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Richiesta inviata!",
        description: "L'organizzatore riceverà la tua richiesta di partecipazione",
      });

      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      // Create in-app notification for session creator
      await createNotification({
        userId: session.creator_id,
        type: "session_join_request",
        title: "Nuova richiesta di partecipazione",
        message: `${userProfile?.name || "Un utente"} vuole partecipare a "${session.title}"`,
        metadata: {
          session_id: session.id,
          session_title: session.title,
          user_id: user.id,
          user_name: userProfile?.name || undefined,
        },
      });

      // Send notification email to session creator
      try {
        await supabase.functions.invoke("send-session-notification", {
          body: {
            type: "join_request",
            sessionId: session.id,
            participantUserId: user.id,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }
  };

  const handleApprove = async (participantId: string, participantUserId: string) => {
    setActionLoading(participantId);
    const { error } = await approveParticipant(participantId);
    setActionLoading(null);

    if (error) {
      toast({ title: "Errore", description: "Impossibile approvare", variant: "destructive" });
    } else {
      toast({ title: "Approvato!", description: "Partecipante confermato" });

      // Create in-app notification for participant
      await createNotification({
        userId: participantUserId,
        type: "session_request_approved",
        title: "Richiesta approvata!",
        message: `La tua partecipazione a "${session!.title}" è stata confermata`,
        metadata: {
          session_id: session!.id,
          session_title: session!.title,
        },
      });

      // Send approval notification email
      try {
        await supabase.functions.invoke("send-session-notification", {
          body: {
            type: "request_approved",
            sessionId: session!.id,
            participantUserId,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }
  };

  const handleReject = async (participantId: string, participantUserId: string) => {
    setActionLoading(participantId);
    const { error } = await rejectParticipant(participantId);
    setActionLoading(null);

    if (error) {
      toast({ title: "Errore", description: "Impossibile rifiutare", variant: "destructive" });
    } else {
      toast({ title: "Rifiutato", description: "Richiesta rifiutata" });

      // Create in-app notification for participant
      await createNotification({
        userId: participantUserId,
        type: "session_request_rejected",
        title: "Richiesta non accettata",
        message: `La tua richiesta per "${session!.title}" non è stata accettata`,
        metadata: {
          session_id: session!.id,
          session_title: session!.title,
        },
      });

      // Send rejection notification email
      try {
        await supabase.functions.invoke("send-session-notification", {
          body: {
            type: "request_rejected",
            sessionId: session!.id,
            participantUserId,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }
  };

  const handleCancelSession = async () => {
    setCancelDialogOpen(false);
    
    // Get confirmed participants before cancelling
    const confirmedParticipants = session?.participants.filter(p => p.status === "confirmed") || [];
    
    const { error } = await cancelSession();

    if (error) {
      toast({ title: "Errore", description: "Impossibile annullare la sessione", variant: "destructive" });
    } else {
      toast({ title: "Sessione annullata", description: "La sessione è stata cancellata" });

      // Notify all confirmed participants about the cancellation
      for (const participant of confirmedParticipants) {
        await createNotification({
          userId: participant.user_id,
          type: "session_cancelled",
          title: "Sessione annullata",
          message: `La sessione "${session!.title}" è stata annullata dall'organizzatore`,
          metadata: {
            session_id: session!.id,
            session_title: session!.title,
          },
        });
      }

      navigate("/community");
    }
  };

  const handleLeave = async () => {
    if (!session?.myParticipation) return;

    setActionLoading("leave");
    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("id", session.myParticipation.id);

    setActionLoading(null);

    if (error) {
      toast({ title: "Errore", description: "Impossibile annullare", variant: "destructive" });
    } else {
      toast({ title: "Partecipazione annullata", description: "Hai lasciato la sessione" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => navigate(backPath)} className="w-10 h-10 rounded-full bg-card border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-4 py-6 max-w-[430px] mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-muted mb-4" />
        <h2 className="text-lg font-semibold mb-2">Sessione non trovata</h2>
        <Button variant="outline" onClick={() => navigate("/community")}>
          Torna alla Community
        </Button>
      </div>
    );
  }

  const spotsLeft = session.max_participants - session.confirmedCount - session.pendingCount;
  const isFull = spotsLeft <= 0;
  const pendingParticipants = session.participants.filter(p => p.status === "pending");
  const confirmedParticipants = session.participants.filter(p => p.status === "confirmed");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(backPath)} className="w-10 h-10 rounded-full bg-card border flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg truncate flex-1">{session.title}</h1>
        {session.isCreator && session.status === "active" && (
          <button
            onClick={() => navigate(`/sessions/${id}/edit`)}
            className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Session Info Card */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{session.title}</h2>
              {session.spot && (
                <p className="text-sm text-muted flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {session.spot.name} · {session.spot.location}
                </p>
              )}
            </div>
            <Badge variant={session.level === "advanced" ? "destructive" : "secondary"}>
              {mapLevel(session.level)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDateTime(session.date_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>{session.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>{session.confirmedCount}/{session.max_participants} confermati</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>{mapSessionType(session.session_type)}</span>
            </div>
          </div>

          {session.description && (
            <p className="text-sm text-muted border-t pt-3">{session.description}</p>
          )}
        </div>

        {/* Creator */}
        <div
          className="bg-card rounded-2xl border p-4 mb-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate(`/users/${session.creator_id}`, { state: { from: `/sessions/${id}` } })}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-deep to-primary-light flex items-center justify-center text-lg font-bold text-primary-foreground">
            {session.creator?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="font-medium">{session.creator?.name || "Organizzatore"}</p>
            <p className="text-sm text-muted flex items-center gap-1">
              {session.creatorRole === "instructor" && (
                <>
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>Istruttore</span>
                </>
              )}
              {session.creatorRole === "user" && "Apneista"}
            </p>
          </div>
        </div>

        {/* My Status */}
        {session.myParticipation && (
          <div className={`rounded-2xl border p-4 mb-4 ${
            session.myParticipation.status === "confirmed" 
              ? "bg-success/10 border-success/30" 
              : "bg-warning/10 border-warning/30"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {session.myParticipation.status === "confirmed" 
                    ? "✓ Sei iscritto!" 
                    : "⏳ In attesa di approvazione"}
                </p>
                <p className="text-sm text-muted">
                  {session.myParticipation.status === "confirmed" 
                    ? "La tua partecipazione è confermata"
                    : "L'organizzatore deve approvare la tua richiesta"}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLeave}
                disabled={actionLoading === "leave"}
              >
                {actionLoading === "leave" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Annulla"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Participants (for creator) */}
        {session.isCreator && (
          <div className="space-y-4">
            {/* Pending Requests */}
            {pendingParticipants.length > 0 && (
              <div className="bg-card rounded-2xl border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-sm">
                    {pendingParticipants.length}
                  </span>
                  Richieste in attesa
                </h3>
                <div className="space-y-2">
                  {pendingParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50">
                      <div
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                        onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                      >
                        {p.profile?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span
                        className="flex-1 text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                      >
                        {p.profile?.name || "Utente"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-success hover:bg-success/20"
                          onClick={() => handleApprove(p.id, p.user_id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/20"
                          onClick={() => handleReject(p.id, p.user_id)}
                          disabled={!!actionLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Participants */}
            <div className="bg-card rounded-2xl border p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-sm">
                  {confirmedParticipants.length}
                </span>
                Partecipanti confermati
              </h3>
              {confirmedParticipants.length > 0 ? (
                <div className="space-y-2">
                  {confirmedParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50">
                      <div
                        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                        onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                      >
                        {p.profile?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span
                        className="flex-1 text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                      >
                        {p.profile?.name || "Utente"}
                      </span>
                      <Check className="w-4 h-4 text-success" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Nessun partecipante confermato</p>
              )}
            </div>

            {/* Cancel Session */}
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setCancelDialogOpen(true)}
            >
              Annulla sessione
            </Button>
          </div>
        )}

        {/* Join Button (for non-participants, non-creators) */}
        {!session.isCreator && !session.isParticipant && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
            <div className="max-w-[430px] mx-auto">
              <Button
                variant="primaryGradient"
                className="w-full"
                onClick={handleJoinRequest}
                disabled={joining || isFull}
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFull ? (
                  "Sessione piena"
                ) : (
                  "Richiedi di partecipare"
                )}
              </Button>
              {spotsLeft > 0 && spotsLeft <= 3 && (
                <p className="text-center text-sm text-warning mt-2">
                  Solo {spotsLeft} {spotsLeft === 1 ? "posto" : "posti"} rimast{spotsLeft === 1 ? "o" : "i"}!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Safety Modal */}
      <SafetyWarningModal
        open={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        onConfirm={confirmJoin}
        sessionTitle={session.title}
        sessionLevel={session.level}
        userCertified={isCertified}
        loading={joining}
      />

      {/* Cancel Session Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annullare la sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è irreversibile. Tutti i partecipanti verranno notificati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSession} className="bg-destructive text-destructive-foreground">
              Conferma annullamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionDetails;
