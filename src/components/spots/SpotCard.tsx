import { Spot } from "@/hooks/useSpots";
import { t } from "@/lib/i18n";
import { MapPin, Heart, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/brand/BrandIcon";

interface SpotCardProps {
  spot: Spot;
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onViewDetails?: () => void;
  onAddFavorite?: () => void;
  isFavorite?: boolean;
  hideNavigation?: boolean;
}

const getEnvironmentLabel = (type: string): string => {
  switch (type) {
    case "sea":
      return t("sea");
    case "lake":
      return t("lake");
    case "pool":
      return t("pool");
    case "deep_pool":
      return t("deepPool");
    default:
      return type;
  }
};

const getEnvironmentEmoji = (type: string): string | null => {
  switch (type) {
    case "sea":
      return "🌊";
    case "lake":
      return "🏔️";
    case "pool":
      return "🏊";
    case "deep_pool":
      return "🎯";
    default:
      return null;
  }
};

const SpotCard = ({
  spot,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  onViewDetails,
  onAddFavorite,
  isFavorite = false,
  hideNavigation = false,
}: SpotCardProps) => {
  return (
    <div>
      {/* Navigation - only show if not hidden */}
      {!hideNavigation && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted" />
          </button>
          
          <span className="text-sm text-muted">
            {currentIndex + 1} {t("spotOf")} {totalCount}
          </span>
          
          <button
            onClick={onNext}
            disabled={currentIndex === totalCount - 1}
            className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted" />
          </button>
        </div>
      )}

      {/* Spot info */}
      <div className="flex gap-3">
        {/* Placeholder image */}
        <div className="w-20 h-20 rounded-xl bg-card flex items-center justify-center text-3xl flex-shrink-0">
          {getEnvironmentEmoji(spot.environment_type) ?? (
            <BrandIcon name="spot" variant="color" size={32} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span className="text-xs mb-1 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {getEnvironmentLabel(spot.environment_type)}
          </span>

          {/* Name */}
          <h3 className="font-semibold text-foreground truncate mb-0.5">
            {spot.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{spot.location}</span>
          </div>
        </div>
      </div>

      {/* Description if available */}
      {spot.description && (
        <p className="text-sm text-muted mt-3 line-clamp-2">
          {spot.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="pill"
          size="pill"
          className="flex-1"
          onClick={onViewDetails}
        >
          {t("viewSpotDetails")}
        </Button>
        <Button
          variant={isFavorite ? "pill" : "pillOutline"}
          size="icon"
          className="w-10 h-10 rounded-full flex-shrink-0"
          onClick={onAddFavorite}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </Button>
      </div>
    </div>
  );
};

export default SpotCard;
