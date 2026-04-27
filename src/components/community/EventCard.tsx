import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin, Calendar, Users, Ticket, Trophy, Compass } from "lucide-react";
import type { EventWithDetails } from "@/hooks/useEvents";
import { t } from "@/lib/i18n";

const eventTypeConfig: Record<string, { label: string; icon: typeof Ticket; color: string }> = {
  stage: { label: "Stage", icon: Ticket, color: "bg-purple-500/20 text-purple-300" },
  competition: { label: "Gara", icon: Trophy, color: "bg-red-500/20 text-red-300" },
  trip: { label: "Trip", icon: Compass, color: "bg-blue-500/20 text-blue-300" },
};

interface EventCardProps {
  event: EventWithDetails;
  onClick: () => void;
}

export const EventCard = ({ event, onClick }: EventCardProps) => {
  const config = eventTypeConfig[event.event_type] || eventTypeConfig.stage;
  const Icon = config.icon;

  const formatDateRange = () => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    return `${format(start, "d", { locale: it })}–${format(end, "d MMM yyyy", { locale: it })}`;
  };

  return (
    <button
      onClick={onClick}
      className="card-session min-w-[280px] max-w-[280px] text-left"
    >
      {/* Type badge + location */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        {event.location && (
          <span className="chip-session flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.location.length > 20 ? event.location.slice(0, 20) + "…" : event.location}
          </span>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--card-soft))]">
        <Calendar className="w-3 h-3" />
        {formatDateRange()}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-card-foreground text-sm leading-tight line-clamp-2">
        {event.title}
      </h3>

      {/* Duration + spots */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="chip-session">
          🏊 {event.days_count} {event.days_count === 1 ? "giorno" : "giorni"}
        </span>
        {event.max_participants > 0 && (
          <span className="chip-session flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event.max_participants - event.participant_count} posti
          </span>
        )}
        {event.is_paid && (
          <span className="chip-session">💰</span>
        )}
      </div>

      {/* Creator */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2">
          <div className="avatar-creator">
            {event.creator_avatar ? (
              <img src={event.creator_avatar} className="w-full h-full rounded-full object-cover" alt="" />
            ) : (
              event.creator_name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs text-[hsl(var(--card-soft))]">
            {event.creator_name}
            {event.creator_is_instructor && ` · ${t("roleInstructor")}`}
          </span>
        </div>
        <span className="text-xs text-[hsl(var(--card-soft))] underline">Dettagli</span>
      </div>
    </button>
  );
};
