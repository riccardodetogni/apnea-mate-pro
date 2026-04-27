import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityContext } from "@/hooks/useCommunityContext";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n";
import { createNotification } from "@/lib/notifications";
import { getOrCreateSessionConversation } from "@/hooks/useConversations";
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
  Share2,
  MessageCircle,
  DollarSign,
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

import { mapLevel, mapSessionType } from "@/lib/i18n";

const SessionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string })?.from || "/community";
  const { user } = useAuth();
  const { toast } = useToast();
  const { isCertified, canJoinSession } = useCommunityContext();

  const { session, loading, approveParticipant, rejectParticipant, cancelSession, refetch } = useSessionDetails(id);

  const [joining, setJoining] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: session?.title,
        text: `Partecipa alla sessione "${session?.title}"`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t("linkCopied") });
    }
  };

  const handleJoinRequest = () => {
    if (!session) return;
    const reserved = session.confirmedCount + session.pendingCount;
    if (reserved >= session.max_participants) {
      toast({
        title: t("sessionFull"),
        description: t("sessionFullDesc"),
        variant: "destructive",
      });
      return;
    }
    const { requiresWarning } = canJoinSession(session.level);
    // Always show safety modal
    setSafetyModalOpen(true);
  };

  const confirmJoin = async () => {
    if (!session || !user) return;
    const reserved = session.confirmedCount + session.pendingCount;
    if (reserved >= session.max_participants) {
      setSafetyModalOpen(false);
      toast({
        title: t("sessionFull"),
        description: t("sessionFullDesc"),
        variant: "destructive",
      });
      return;
    }

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
          title: t("alreadyRequested"),
          description: t("alreadyRequestedDesc"),
          variant: "destructive",
        });
      } else if (error.message?.includes("session_full")) {
        toast({
          title: t("sessionFull"),
          description: t("sessionFullDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("error"),
          description: error.message || t("cannotSendRequest"),
          variant: "destructive",
        });
      }
    } else {
      const isCreator = user.id === session.creator_id;

      if (isCreator) {
        // Auto-confirm creator joining own session
        await supabase
          .from("session_participants")
          .update({ status: "confirmed" })
          .eq("session_id", session.id)
          .eq("user_id", user.id);

        toast({
          title: t("youJoined"),
          description: t("youJoinedDesc"),
        });
      } else {
        toast({
          title: t("requestSent"),
          description: t("requestSentDesc"),
        });

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();

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
    }
  };

  const handleApprove = async (participantId: string, participantUserId: string) => {
    setActionLoading(participantId);
    const { error } = await approveParticipant(participantId);
    setActionLoading(null);

    if (error) {
      toast({ title: t("error"), description: t("cannotApprove"), variant: "destructive" });
    } else {
      toast({ title: t("approvedTitle"), description: t("approvedDesc") });

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
      toast({ title: t("error"), description: t("cannotReject"), variant: "destructive" });
    } else {
      toast({ title: t("rejectedTitle"), description: t("rejectedDesc") });

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
    
    // Get ALL participants (confirmed + pending) before cancelling
    const allParticipants = session?.participants.filter(p => p.status === "confirmed" || p.status === "pending") || [];
    
    const { error } = await cancelSession();

    if (error) {
      toast({ title: t("error"), description: t("cannotCancelSession"), variant: "destructive" });
    } else {
      toast({ title: t("sessionCancelled"), description: t("sessionCancelledDesc") });

      // Notify all confirmed AND pending participants about the cancellation
      for (const participant of allParticipants) {
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
    if (!session?.myParticipation || !user) return;

    setActionLoading("leave");
    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("id", session.myParticipation.id);

    setActionLoading(null);

    if (error) {
      toast({ title: t("error"), description: t("cannotCancelParticipation"), variant: "destructive" });
    } else {
      toast({ title: t("participationCancelled"), description: t("participationCancelledDesc") });
      await refetch();

      // Notify creator that a participant left
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      await createNotification({
        userId: session.creator_id,
        type: "session_cancelled",
        title: "Partecipante ritirato",
        message: `${userProfile?.name || "Un utente"} ha lasciato la sessione "${session.title}"`,
        metadata: {
          session_id: session.id,
          session_title: session.title,
          user_id: user.id,
          user_name: userProfile?.name || undefined,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => navigate(backPath)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
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
        <h2 className="text-lg font-semibold mb-2">{t("sessionNotFound")}</h2>
        <Button variant="outline" onClick={() => navigate("/community")}>
          {t("backToCommunity")}
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
        <button onClick={() => navigate(backPath)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg truncate flex-1">{session.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4 text-foreground" />
          </button>
          {session.isCreator && session.status === "active" && (
            <button
              onClick={() => navigate(`/sessions/${id}/edit`)}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Session Info Card */}
        <div className="card-session !rounded-2xl !p-0 mb-4">
          <div className="relative z-[1] p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{session.title}</h2>
              {session.spot && (
                <p className="text-sm text-[hsl(var(--card-muted))] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {session.spot.name} · {session.spot.location}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={session.level === "advanced" ? "destructive" : "secondary"}>
                {mapLevel(session.level)}
              </Badge>
              {(session as any).is_paid && (
                <Badge className="gap-1 bg-amber-500/15 text-amber-400 border-none text-xs">
                  <DollarSign className="w-3 h-3" />
                  {t("paidSession")}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--card-soft))]">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDateTime(session.date_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--card-soft))]">
              <Clock className="w-4 h-4 text-primary" />
              <span>{session.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--card-soft))]">
              <Users className="w-4 h-4 text-primary" />
              <span>{session.confirmedCount}/{session.max_participants} confermati</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--card-muted))]">
              <span>{mapSessionType(session.session_type)}</span>
            </div>
          </div>

          {session.description && (
            <p className="text-sm text-[hsl(var(--card-muted))] border-t border-[hsl(var(--card-border))] pt-3">{session.description}</p>
          )}
          </div>
        </div>

        {/* Chat button for confirmed participants only */}
        {(session.isCreator || (session.myParticipation?.status === 'confirmed')) && (
          <Button
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={async () => {
              try {
                const convId = await getOrCreateSessionConversation(session.id, user!.id);
                navigate(`/messages/${convId}`);
              } catch { /* ignore */ }
            }}
          >
            <MessageCircle className="w-4 h-4" />
            {t("chatSession")}
          </Button>
        )}
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("organizer" as any)}</h3>
        <div
          className="card-session !rounded-2xl !p-0 mb-4 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate(`/users/${session.creator_id}`, { state: { from: `/sessions/${id}` } })}
        >
          <div className="relative z-[1] p-4 flex items-center gap-3">
          {session.creator?.avatar_url ? (
            <img
              src={session.creator.avatar_url}
              alt={session.creator.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full avatar-gradient flex items-center justify-center text-lg font-bold text-white">
              {session.creator?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-card-foreground">{session.creator?.name || "Organizzatore"}</p>
            <p className="text-sm text-[hsl(var(--card-muted))] flex items-center gap-1">
              {session.creatorRole === "instructor" && (
                <>
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>{t("roleInstructor")}</span>
                </>
              )}
              {session.creatorRole === "user" && t("freediver")}
            </p>
          </div>
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
                  t("cancel")
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
              <div className="card-session !rounded-2xl !p-0">
                <div className="relative z-[1] p-4">
                <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-sm">
                    {pendingParticipants.length}
                  </span>
                  {t("pendingRequests")}
                </h3>
                <div className="space-y-2">
                  {pendingParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-[hsl(var(--badge-blue-bg))]">
                      {p.profile?.avatar_url ? (
                        <img
                          src={p.profile.avatar_url}
                          alt={p.profile.name}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                          onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center text-sm font-medium text-white cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                          onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                        >
                          {p.profile?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <span
                        className="flex-1 text-sm text-card-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                      >
                        {p.profile?.name || t("user")}
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
              </div>
            )}

            {/* Confirmed Participants */}
            <div className="card-session !rounded-2xl !p-0">
              <div className="relative z-[1] p-4">
              <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-sm">
                  {confirmedParticipants.length}
                </span>
                {t("confirmedParticipants")}
              </h3>
              {confirmedParticipants.length > 0 ? (
                <div className="space-y-2">
                  {confirmedParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-[hsl(var(--badge-blue-bg))]">
                      {p.profile?.avatar_url ? (
                        <img
                          src={p.profile.avatar_url}
                          alt={p.profile.name}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                          onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center text-sm font-medium text-white cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                          onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                        >
                          {p.profile?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <span
                        className="flex-1 text-sm text-card-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/users/${p.user_id}`, { state: { from: `/sessions/${id}` } })}
                      >
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

            {/* Cancel Session */}
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setCancelDialogOpen(true)}
            >
              {t("cancelSession")}
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
                  t("sessionFullButton")
                ) : (
                  t("requestToJoin")
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
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSession} className="bg-destructive text-destructive-foreground">
              {t("confirmCancellation")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionDetails;
