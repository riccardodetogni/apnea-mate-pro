import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyParticipations, MyCreatedSession } from "@/hooks/useMyParticipations";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Check,
  Loader2,
  Plus,
  Crown,
  Bell,
} from "lucide-react";

const formatDate = (dateTime: string): string => {
  const date = new Date(dateTime);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("it-IT", options);
};

const mapSessionType = (type: string): string => {
  switch (type) {
    case "sea_trip": return "Mare";
    case "pool_session": return "Piscina";
    case "deep_pool_session": return "Deep pool";
    case "lake_trip": return "Lago";
    case "training": return "Allenamento";
    default: return type;
  }
};

const MySessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    pendingParticipations, 
    confirmedParticipations, 
    createdWithPendingRequests,
    createdWithoutPendingRequests,
    loading, 
    cancelParticipation 
  } = useMyParticipations();


  const SessionCard = ({ participation, isPending }: { participation: any; isPending: boolean }) => {
    const session = participation.session;
    if (!session) return null;

    return (
      <button
        onClick={() => navigate(`/sessions/${session.id}`, { state: { from: '/my-sessions' } })}
        className="card-session w-full p-4 text-left hover:border-primary/30 transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">{session.title}</h3>
            {session.spot && (
              <p className="text-sm text-[hsl(var(--card-muted))] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {session.spot.name}
              </p>
            )}
          </div>
          <Badge variant={isPending ? "outline" : "default"} className={isPending ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30"}>
            {isPending ? "In attesa" : "Confermato"}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-[hsl(var(--card-muted))]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(session.date_time)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {session.duration_minutes}min
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[hsl(var(--card-border))]">
          <span className="text-xs text-[hsl(var(--card-muted))]">
            {mapSessionType(session.session_type)} · {participation.confirmed_count}/{session.max_participants} partecipanti
          </span>
          <span className="text-xs text-[hsl(var(--card-muted))]">
            Organizzatore: {session.creator?.name || "—"}
          </span>
        </div>
      </button>
    );
  };

  const CreatedSessionCard = ({ session }: { session: MyCreatedSession }) => {
    return (
      <button
        onClick={() => navigate(`/sessions/${session.id}`, { state: { from: '/my-sessions' } })}
        className="card-session w-full p-4 text-left hover:border-primary/30 transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">{session.title}</h3>
            {session.spot && (
              <p className="text-sm text-[hsl(var(--card-muted))] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {session.spot.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {session.pending_count > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                <Bell className="w-3 h-3 mr-1" />
                {session.pending_count}
              </Badge>
            )}
            <Badge variant="outline" className="bg-[hsl(var(--badge-blue-bg))] text-primary border-primary/30">
              <Crown className="w-3 h-3 mr-1" />
              Creata da te
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-[hsl(var(--card-muted))]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(session.date_time)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {session.duration_minutes}min
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[hsl(var(--card-border))]">
          <span className="text-xs text-[hsl(var(--card-muted))]">
            {mapSessionType(session.session_type)} · {session.confirmed_count}/{session.max_participants} confermati
          </span>
          {session.pending_count > 0 && (
            <span className="text-xs text-warning font-medium">
              {session.pending_count} richieste in attesa
            </span>
          )}
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => navigate("/community")} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Le mie sessioni</h1>
        </header>
        <div className="px-4 py-6 max-w-[430px] mx-auto space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasAny = pendingParticipations.length > 0 || 
                 confirmedParticipations.length > 0 ||
                 createdWithPendingRequests.length > 0 ||
                 createdWithoutPendingRequests.length > 0;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button onClick={() => navigate("/community")} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">Le mie sessioni</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {!hasAny ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Nessuna sessione</h3>
            <p className="text-sm text-muted mb-6">
              Non sei ancora iscritto a nessuna sessione. Esplora la community per trovare sessioni vicino a te!
            </p>
            <Button variant="primaryGradient" onClick={() => navigate("/community")}>
              Esplora sessioni
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Created sessions with pending requests (priority) */}
            {createdWithPendingRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-warning" />
                  Richieste in attesa ({createdWithPendingRequests.reduce((acc, s) => acc + s.pending_count, 0)})
                </h2>
                <div className="space-y-3">
                  {createdWithPendingRequests.map(s => (
                    <CreatedSessionCard key={s.id} session={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Pending participations */}
            {pendingParticipations.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  In attesa di approvazione ({pendingParticipations.length})
                </h2>
                <div className="space-y-3">
                  {pendingParticipations.map(p => (
                    <SessionCard key={p.id} participation={p} isPending={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed participations */}
            {confirmedParticipations.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Confermate ({confirmedParticipations.length})
                </h2>
                <div className="space-y-3">
                  {confirmedParticipations.map(p => (
                    <SessionCard key={p.id} participation={p} isPending={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Created sessions without pending requests */}
            {createdWithoutPendingRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  Create da te ({createdWithoutPendingRequests.length})
                </h2>
                <div className="space-y-3">
                  {createdWithoutPendingRequests.map(s => (
                    <CreatedSessionCard key={s.id} session={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySessions;
