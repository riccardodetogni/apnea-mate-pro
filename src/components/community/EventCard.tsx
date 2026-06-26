import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin, Calendar, Users, Ticket, Trophy, Compass, BadgeCheck } from "lucide-react";
import type { EventWithDetails } from "@/hooks/useEvents";
import { t } from "@/lib/i18n";

const eventTypeConfig: Record<string, { label: string; icon: typeof Ticket; color: string; solid: string }> = {
  stage: { label: "Stage", icon: Ticket, color: "bg-purple-500/20 text-purple-300", solid: "bg-purple-600" },
  competition: { label: "Gara", icon: Trophy, color: "bg-red-500/20 text-red-300", solid: "bg-red-600" },
  trip: { label: "Trip", icon: Compass, color: "bg-blue-500/20 text-blue-300", solid: "bg-blue-600" },
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

  const hasCover = !!event.cover_image_url;
  const chipClass = hasCover ? "chip-solid" : "chip-session";
  const typeChipClass = hasCover
    ? `chip-solid-accent ${config.solid}`
    : `inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full ${config.color}`;
  const softText = hasCover ? "text-white/90 cover-text-shadow" : "text-[hsl(var(--card-soft))]";
  const titleText = hasCover ? "text-white cover-text-shadow" : "text-card-foreground";

  return (
    <button
      onClick={onClick}
      className={`card-session min-w-[280px] max-w-[280px] text-left ${hasCover ? "has-cover min-h-[210px]" : ""}`}
    >
      {hasCover && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none brightness-[0.85] saturate-[0.9]"
            style={{ backgroundImage: `url(${event.cover_image_url})` }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[40%] z-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[70%] z-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pointer-events-none"
          />
        </>
      )}
      {/* Type badge + location */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={typeChipClass}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        {event.location && (
          <span className={`${chipClass} flex items-center gap-1`}>
            <MapPin className="w-3 h-3" />
            {event.location.length > 20 ? event.location.slice(0, 20) + "…" : event.location}
          </span>
        )}
      </div>

      {/* Date range */}
      <div className={`flex items-center gap-1.5 text-xs ${softText}`}>
        <Calendar className="w-3 h-3" />
        {formatDateRange()}
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${titleText}`}>
        {hasCover ? (
          <span className="bg-black/55 box-decoration-clone px-1.5 py-0.5 rounded-md">{event.title}</span>
        ) : event.title}
      </h3>

      {/* Duration + spots */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={chipClass}>
          🏊 {event.days_count} {event.days_count === 1 ? "giorno" : "giorni"}
        </span>
        {event.max_participants > 0 && (
          (() => {
            const left = event.max_participants - event.participant_count;
            const isFull = left <= 0;
            return (
              <span className={`${chipClass} flex items-center gap-1 ${isFull ? "!bg-destructive !text-destructive-foreground" : ""}`}>
                <Users className="w-3 h-3" />
                {isFull ? t("fullShort") : `${left} ${t("spots")}`}
              </span>
            );
          })()
        )}
        {event.is_paid && (
          <span className={chipClass}>💰</span>
        )}
      </div>

      {/* Creator */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2">
          {event.group_name ? (
            <>
              <div className={`avatar-creator overflow-hidden ${hasCover ? "ring-2 ring-white/80 shadow-md" : ""}`}>
                {event.group_avatar ? (
                  <img src={event.group_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  event.group_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`text-xs flex items-center gap-1 ${softText}`}>
                {event.group_name}
                {event.group_verified && <BadgeCheck className="w-3 h-3 text-primary" />}
              </span>
            </>
          ) : (
            <>
              <div className={`avatar-creator ${hasCover ? "ring-2 ring-white/80 shadow-md" : ""}`}>
                {event.creator_avatar ? (
                  <img src={event.creator_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  event.creator_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`text-xs ${softText}`}>
                {event.creator_name}
                {event.creator_is_instructor && ` · ${t("roleInstructor")}`}
              </span>
            </>
          )}
        </div>
        <span className={hasCover ? "chip-solid text-[11px]" : "text-xs text-[hsl(var(--card-soft))] underline"}>Dettagli</span>
      </div>
    </button>
  );
};
