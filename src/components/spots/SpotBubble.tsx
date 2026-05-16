import { Spot } from "@/hooks/useSpots";
import { MapPin, Heart, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { BrandIcon } from "@/components/brand/BrandIcon";

const envEmoji: Record<string, string> = {
  sea: "🌊",
  lake: "🏞️",
  pool: "🏊",
};

interface SpotBubbleProps {
  spot: Spot;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
}

const SpotBubble = ({
  spot,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
}: SpotBubbleProps) => {
  const emoji = envEmoji[spot.environment_type];

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[1001] max-w-[430px] mx-auto animate-in slide-in-from-bottom duration-300">
      <div
        onClick={onViewDetails}
        className="card-session !p-3 !flex-row !items-center !gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      >
        {/* Environment emoji */}
        <div className="w-11 h-11 rounded-xl bg-[hsl(var(--badge-blue-bg))] flex items-center justify-center text-xl shrink-0">
          {emoji ? emoji : <BrandIcon name="spot" variant="color" size={24} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate text-sm">
            {spot.name}
          </h3>
          <p className="text-xs text-[hsl(var(--card-muted))] truncate flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="shrink-0" />
            {spot.location}
          </p>
          {spot.hasActiveSessions && (
            <p className="text-xs text-primary font-medium mt-1">
              {t("availableSessions")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[hsl(var(--badge-blue-bg))] transition-colors"
          >
            <Heart
              size={18}
              className={
                isFavorite
                  ? "fill-destructive text-destructive"
                  : "text-[hsl(var(--card-muted))]"
              }
            />
          </button>
          <ChevronRight size={16} className="text-[hsl(var(--card-muted))]" />
        </div>
      </div>
    </div>
  );
};

export default SpotBubble;
