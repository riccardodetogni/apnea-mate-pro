import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface CalendarSession {
  id: string;
  title: string;
  date_time: string;
  status: "confirmed" | "pending" | "created" | "available";
  spotName?: string;
  sessionType?: string;
  durationMinutes?: number;
}

interface SessionCalendarProps {
  sessions: CalendarSession[];
  onSessionClick?: (sessionId: string) => void;
  navigateFrom?: string;
}

const statusConfig = {
  confirmed: { label: "Confermato", dotClass: "bg-[hsl(var(--success))]", badgeClass: "bg-success/10 text-success border-success/30" },
  pending: { label: "In attesa", dotClass: "bg-[hsl(var(--warning))]", badgeClass: "bg-warning/10 text-warning border-warning/30" },
  created: { label: "Creata da te", dotClass: "bg-[hsl(var(--primary))]", badgeClass: "bg-primary/10 text-primary border-primary/30" },
  available: { label: "Disponibile", dotClass: "bg-[hsl(var(--muted-foreground))]", badgeClass: "bg-muted/30 text-muted-foreground border-muted-foreground/30" },
};

export const SessionCalendar = ({ sessions, onSessionClick, navigateFrom }: SessionCalendarProps) => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Group sessions by date for modifiers
  const { modifiers, modifiersClassNames, sessionsByDate } = useMemo(() => {
    const byDate: Record<string, CalendarSession[]> = {};
    const statusDates: Record<string, Date[]> = {
      confirmed: [],
      pending: [],
      created: [],
      available: [],
    };

    sessions.forEach((s) => {
      const date = parseISO(s.date_time);
      const key = format(date, "yyyy-MM-dd");
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(s);

      // Add date to the highest-priority status bucket for this day
      const existing = statusDates[s.status];
      if (!existing.some((d) => isSameDay(d, date))) {
        existing.push(date);
      }
    });

    return {
      modifiers: {
        sessionConfirmed: statusDates.confirmed,
        sessionPending: statusDates.pending,
        sessionCreated: statusDates.created,
        sessionAvailable: statusDates.available,
      },
      modifiersClassNames: {
        sessionConfirmed: "session-dot-confirmed",
        sessionPending: "session-dot-pending",
        sessionCreated: "session-dot-created",
        sessionAvailable: "session-dot-available",
      },
      sessionsByDate: byDate,
    };
  }, [sessions]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const daySessions = sessionsByDate[selectedKey] || [];

  const handleClick = (sessionId: string) => {
    if (onSessionClick) {
      onSessionClick(sessionId);
    } else {
      navigate(`/sessions/${sessionId}`, { state: { from: navigateFrom || "/my-sessions" } });
    }
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDay}
        onSelect={(d) => d && setSelectedDay(d)}
        locale={it}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="pointer-events-auto rounded-xl border-0 bg-card p-3 mx-auto"
        classNames={{
          caption_label: "text-sm font-medium text-card-foreground",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 text-card-foreground border border-[hsl(var(--card-border))]",
          head_cell: "text-[hsl(var(--card-muted))] rounded-md w-9 font-normal text-[0.8rem]",
          day: "h-9 w-9 p-0 font-normal text-card-foreground hover:bg-[hsl(var(--card-border))] rounded-full transition-colors aria-selected:opacity-100",
          day_selected: "bg-[hsl(var(--accent))] text-accent-foreground hover:bg-[hsl(var(--accent))] hover:text-accent-foreground focus:bg-[hsl(var(--accent))] focus:text-accent-foreground rounded-full",
          day_today: "bg-[hsl(var(--primary))] text-primary-foreground rounded-full",
          day_outside: "text-[hsl(var(--card-muted))] opacity-40 aria-selected:opacity-50",
          day_disabled: "text-[hsl(var(--card-muted))] opacity-30",
        }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {(["confirmed", "pending", "created", "available"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("w-2 h-2 rounded-full", statusConfig[s].dotClass)} />
            {statusConfig[s].label}
          </div>
        ))}
      </div>

      {/* Day sessions list */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {format(selectedDay, "EEEE d MMMM", { locale: it })}
        </h3>
        {daySessions.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 py-4 text-center">{t("noSessionsOnDate")}</p>
        ) : (
          daySessions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleClick(s.id)}
              className="card-session w-full p-3 text-left hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-card-foreground text-sm truncate">{s.title}</h4>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", statusConfig[s.status].badgeClass)}>
                      {statusConfig[s.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[hsl(var(--card-muted))]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(s.date_time), "HH:mm")}
                      {s.durationMinutes && ` · ${s.durationMinutes}min`}
                    </span>
                    {s.spotName && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {s.spotName}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
