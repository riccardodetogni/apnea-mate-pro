import { MapPin, Heart, ChevronRight, Calendar, GraduationCap } from "lucide-react";
import { Spot } from "@/hooks/useSpots";
import { EventWithDetails } from "@/hooks/useEvents";
import { CourseWithDetails } from "@/hooks/useCourses";
import { t } from "@/lib/i18n";
import { BrandIcon } from "@/components/brand/BrandIcon";

const envEmoji: Record<string, string> = {
  sea: "🌊",
  lake: "🏞️",
  pool: "🏊",
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const fmt = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" });
  if (sameDay) return fmt.format(s);
  return `${fmt.format(s)} – ${fmt.format(e)}`;
}

export type MapBubbleItem =
  | { type: "spot"; data: Spot; isFavorite: boolean; onToggleFavorite: () => void }
  | { type: "event"; data: EventWithDetails }
  | { type: "course"; data: CourseWithDetails };

interface MapItemBubbleProps {
  item: MapBubbleItem;
  onViewDetails: () => void;
}

const MapItemBubble = ({ item, onViewDetails }: MapItemBubbleProps) => {
  let icon: React.ReactNode;
  let iconBg: string;
  let title: string;
  let location: string | null;
  let subline: React.ReactNode = null;

  if (item.type === "spot") {
    const spot = item.data;
    const emoji = envEmoji[spot.environment_type];
    iconBg = "bg-[hsl(var(--badge-blue-bg))]";
    icon = emoji ? <span className="text-xl">{emoji}</span> : <BrandIcon name="spot" variant="color" size={24} />;
    title = spot.name;
    location = spot.location;
    if (spot.hasActiveSessions) {
      subline = (
        <p className="text-xs text-primary font-medium mt-1">{t("availableSessions")}</p>
      );
    }
  } else if (item.type === "event") {
    const ev = item.data;
    iconBg = "bg-[hsl(270,70%,55%)]/15";
    icon = <Calendar size={22} className="text-[hsl(270,70%,55%)]" />;
    title = ev.title;
    location = ev.location;
    subline = (
      <p className="text-xs text-[hsl(270,70%,65%)] font-medium mt-1">
        Evento · {formatDateRange(ev.start_date, ev.end_date)}
      </p>
    );
  } else {
    const co = item.data;
    iconBg = "bg-[hsl(30,90%,55%)]/15";
    icon = <GraduationCap size={22} className="text-[hsl(30,90%,55%)]" />;
    title = co.title;
    location = co.location;
    subline = (
      <p className="text-xs text-[hsl(30,90%,60%)] font-medium mt-1">
        Corso · {formatDateRange(co.start_date, co.end_date)}
      </p>
    );
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[1001] max-w-[430px] mx-auto animate-in slide-in-from-bottom duration-300">
      <div
        onClick={onViewDetails}
        className="card-session !p-3 !flex-row !items-center !gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate text-sm">{title}</h3>
          {location && (
            <p className="text-xs text-[hsl(var(--card-muted))] truncate flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="shrink-0" />
              {location}
            </p>
          )}
          {subline}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.type === "spot" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                item.onToggleFavorite();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[hsl(var(--badge-blue-bg))] transition-colors"
            >
              <Heart
                size={18}
                className={
                  item.isFavorite
                    ? "fill-destructive text-destructive"
                    : "text-[hsl(var(--card-muted))]"
                }
              />
            </button>
          )}
          <ChevronRight size={16} className="text-[hsl(var(--card-muted))]" />
        </div>
      </div>
    </div>
  );
};

export default MapItemBubble;