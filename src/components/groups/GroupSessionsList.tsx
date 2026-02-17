import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { Calendar, Users, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Session {
  id: string;
  title: string;
  date_time: string;
  session_type: string;
  level: string;
  max_participants: number;
  participant_count: number;
  spot_name?: string;
}

interface GroupSessionsListProps {
  sessions: Session[];
  groupId?: string;
}

export const GroupSessionsList = ({ sessions, groupId }: GroupSessionsListProps) => {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">{t("upcomingSessions")}</h3>
        <div className="p-4 rounded-xl bg-muted/20 text-center">
          <p className="text-sm text-muted">{t("noMoreSessions")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{t("upcomingSessions")}</h3>
      
      <div className="space-y-2">
        {sessions.map(session => {
          const date = new Date(session.date_time);
          const spotsLeft = session.max_participants - session.participant_count;

          return (
            <button
              key={session.id}
              onClick={() => navigate(`/sessions/${session.id}`, { state: { from: groupId ? `/groups/${groupId}` : '/groups' } })}
              className="card-session !p-3 !flex-row !items-center !gap-3 w-full hover:border-primary/30 transition-colors text-left flex items-center gap-3"
            >
              {/* Date badge */}
              <div className="relative z-[1] w-12 h-12 rounded-lg bg-[hsl(var(--badge-blue-bg))] flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs text-[hsl(var(--card-soft))] font-medium uppercase">
                  {format(date, "MMM", { locale: it })}
                </span>
                <span className="text-lg font-bold text-card-foreground">
                  {format(date, "d")}
                </span>
              </div>

              {/* Info */}
              <div className="relative z-[1] flex-1 min-w-0">
                <h4 className="font-medium text-card-foreground truncate">{session.title}</h4>
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--card-muted))] mt-0.5">
                  <span>{format(date, "HH:mm")}</span>
                  {session.spot_name && (
                    <>
                      <span>·</span>
                      <span className="truncate">{session.spot_name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-[hsl(var(--card-muted))] mt-1">
                  <Users className="w-3 h-3" />
                  <span>{spotsLeft} {t("spots")}</span>
                </div>
              </div>

              <ChevronRight className="relative z-[1] w-4 h-4 text-[hsl(var(--card-muted))] flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
