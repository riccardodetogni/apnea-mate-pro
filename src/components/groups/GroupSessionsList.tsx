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
              className="w-full p-3 rounded-xl bg-card border border-white/8 hover:border-primary/30 transition-colors text-left flex items-center gap-3"
            >
              {/* Date badge */}
              <div className="w-12 h-12 rounded-lg bg-white/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs text-primary font-medium uppercase">
                  {format(date, "MMM", { locale: it })}
                </span>
                <span className="text-lg font-bold text-primary">
                  {format(date, "d")}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-card-foreground truncate">{session.title}</h4>
                <div className="flex items-center gap-2 text-xs text-white/55 mt-0.5">
                  <span>{format(date, "HH:mm")}</span>
                  {session.spot_name && (
                    <>
                      <span>·</span>
                      <span className="truncate">{session.spot_name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-white/55 mt-1">
                  <Users className="w-3 h-3" />
                  <span>{spotsLeft} {t("spots")}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-white/55 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
