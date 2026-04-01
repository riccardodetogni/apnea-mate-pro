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
        className="pointer-events-auto rounded-xl p-4 w-full session-calendar-wrapper"
        classNames={{
          months: "w-full",
          month: "w-full space-y-3",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-semibold text-card-foreground",
          nav: "space-x-1 flex items-center",
          nav_button: "h-8 w-8 bg-transparent p-0 text-card-foreground/60 hover:text-card-foreground border border-[hsl(var(--card-border))] rounded-lg inline-flex items-center justify-center",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex w-full",
          head_cell: "text-[hsl(var(--card-muted))] flex-1 font-normal text-xs text-center",
          row: "flex w-full mt-1",
          cell: "flex-1 text-center text-sm p-0.5 relative",
          day: "h-10 w-10 mx-auto p-0 font-normal text-card-foreground/70 hover:bg-[hsl(var(--card-border))] rounded-full inline-flex items-center justify-center transition-colors",
          day_selected: "!bg-primary !text-primary-foreground rounded-full font-semibold",
          day_today: "ring-1 ring-primary/50 text-primary rounded-full font-semibold",
          day_outside: "text-card-foreground/20",
          day_disabled: "text-card-foreground/20",
          day_hidden: "invisible",
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
