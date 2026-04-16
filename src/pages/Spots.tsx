import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import SpotFiltersSheet, { SpotFilters } from "@/components/spots/SpotFiltersSheet";
import SpotBubble from "@/components/spots/SpotBubble";
import { useSpots, SpotSession } from "@/hooks/useSpots";
import { useSpotFavorites } from "@/hooks/useSpotFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Search, SlidersHorizontal, Heart } from "lucide-react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SpotMap from "@/components/spots/SpotMap";

type QuickFilterType = "all" | "favorites";

const initialFilters: SpotFilters = {
  activities: [],
  levels: [],
  dateFrom: undefined,
  dateTo: undefined,
};

const filterOptions: { id: QuickFilterType; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "filterAll" },
  { id: "favorites", label: "filterFavorites", icon: <Heart className="w-3.5 h-3.5" /> },
];

function sessionsMatchFilters(
  sessions: SpotSession[] | undefined,
  filters: SpotFilters
): boolean {
  if (!sessions || sessions.length === 0) return false;

  return sessions.some((s) => {
    const activityMatch =
      filters.activities.length === 0 || filters.activities.includes(s.session_type);
    const levelMatch =
      filters.levels.length === 0 || filters.levels.includes(s.level);
    const dateMatch =
      (!filters.dateFrom || s.date_time >= filters.dateFrom) &&
      (!filters.dateTo || s.date_time <= filters.dateTo);
    return activityMatch && levelMatch && dateMatch;
  });
}

const hasActiveFilters = (f: SpotFilters) =>
  f.activities.length > 0 || f.levels.length > 0 || !!f.dateFrom || !!f.dateTo;

const Spots = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spots, spotSessions, loading, error } = useSpots();
  const { favoriteIds, toggleFavorite, isFavorite } = useSpotFavorites();

  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<SpotFilters>(initialFilters);

  const filteredSpots = useMemo(() => {
    let result = spots;

    if (quickFilter === "favorites") {
      result = result.filter((spot) => favoriteIds.includes(spot.id));
    }

    if (hasActiveFilters(advancedFilters)) {
      result = result.filter((spot) =>
        sessionsMatchFilters(spotSessions[spot.id], advancedFilters)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (spot) =>
          spot.name.toLowerCase().includes(query) ||
          spot.location.toLowerCase().includes(query)
      );
    }

    return result;
  }, [spots, quickFilter, advancedFilters, searchQuery, favoriteIds, spotSessions]);

  const currentSpot = useMemo(() => {
    if (!selectedSpotId) return undefined;
    return filteredSpots.find((s) => s.id === selectedSpotId);
  }, [filteredSpots, selectedSpotId]);

  const handleSelectSpot = useCallback((spotId: string) => {
    setSelectedSpotId(spotId);
  }, []);

  const handleDeselectSpot = useCallback(() => {
    setSelectedSpotId(undefined);
  }, []);

  const handleQuickFilterChange = useCallback((filter: QuickFilterType) => {
    setQuickFilter(filter);
    setSelectedSpotId(undefined);
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters(initialFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    // filters already applied via state
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (!user) {
      toast.error("Accedi per salvare i preferiti");
      return;
    }
    if (currentSpot) {
      toggleFavorite(currentSpot.id);
      const isFav = isFavorite(currentSpot.id);
      toast.success(isFav ? "Rimosso dai preferiti" : "Aggiunto ai preferiti");
    }
  }, [currentSpot, user, toggleFavorite, isFavorite]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <p className="text-destructive mb-4">{t("error")}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary underline"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-1 relative">
        <SpotMap
          spots={filteredSpots}
          selectedSpotId={selectedSpotId}
          onSelectSpot={handleSelectSpot}
          onDeselectSpot={handleDeselectSpot}
          className="h-full w-full"
        />

        <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pt-[max(1rem,env(safe-area-inset-top))] pointer-events-none">
          <div className="pointer-events-auto max-w-[430px] mx-auto space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  type="text"
                  placeholder={t("searchSpotPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-11 rounded-full bg-white/90 backdrop-blur-md border shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowFiltersSheet(true)}
                className="relative w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border shadow-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-foreground" />
                {hasActiveFilters(advancedFilters) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {filterOptions.map((filter) => {
                const isActive = quickFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleQuickFilterChange(filter.id)}
                    className={`
                      flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors shadow-sm
                      ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/90 backdrop-blur-md border text-foreground hover:bg-white"
                      }
                    `}
                  >
                    {filter.icon}
                    {t(filter.label as any)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {currentSpot && (
        <SpotBubble
          spot={currentSpot}
          isFavorite={isFavorite(currentSpot.id)}
          onToggleFavorite={handleToggleFavorite}
          onViewDetails={() => navigate(`/spots/${currentSpot.id}`)}
        />
      )}

      <BottomNav />

      <SpotFiltersSheet
        open={showFiltersSheet}
        onOpenChange={setShowFiltersSheet}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default Spots;
