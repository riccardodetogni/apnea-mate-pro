import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import SpotFiltersSheet from "@/components/spots/SpotFiltersSheet";
import SpotBubble from "@/components/spots/SpotBubble";
import { useSpots } from "@/hooks/useSpots";
import { useSpotFavorites } from "@/hooks/useSpotFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Search, SlidersHorizontal, Heart } from "lucide-react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SpotMap from "@/components/spots/SpotMap";

type QuickFilterType = "all" | "sea" | "lake" | "pool" | "deep_pool" | "favorites";

const initialFilters = {
  waterTypes: [] as string[],
  depthRanges: [] as string[],
  accessTypes: [] as string[],
  safetyFeatures: [] as string[],
  amenities: [] as string[],
};

const filterOptions: { id: QuickFilterType; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "filterAll" },
  { id: "sea", label: "filterSea" },
  { id: "lake", label: "filterLake" },
  { id: "pool", label: "filterPool" },
  { id: "deep_pool", label: "filterDeepPool" },
  { id: "favorites", label: "filterFavorites", icon: <Heart className="w-3.5 h-3.5" /> },
];

const Spots = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spots, loading, error } = useSpots();
  const { favoriteIds, toggleFavorite, isFavorite } = useSpotFavorites();

  // State
  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(initialFilters);

  // Filter spots
  const filteredSpots = useMemo(() => {
    let result = spots;

    if (quickFilter === "favorites") {
      result = result.filter((spot) => favoriteIds.includes(spot.id));
    } else if (quickFilter !== "all") {
      result = result.filter((spot) => spot.environment_type === quickFilter);
    }

    if (quickFilter === "all" && advancedFilters.waterTypes.length > 0) {
      result = result.filter((spot) =>
        advancedFilters.waterTypes.includes(spot.environment_type)
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
  }, [spots, quickFilter, advancedFilters.waterTypes, searchQuery, favoriteIds]);

  // Current selected spot
  const currentSpot = useMemo(() => {
    if (!selectedSpotId) return undefined;
    return filteredSpots.find((s) => s.id === selectedSpotId);
  }, [filteredSpots, selectedSpotId]);

  // Handlers
  const handleSelectSpot = useCallback((spotId: string) => {
    setSelectedSpotId(spotId);
  }, []);

  const handleDeselectSpot = useCallback(() => {
    setSelectedSpotId(undefined);
  }, []);

  const handleQuickFilterChange = useCallback((filter: QuickFilterType) => {
    setQuickFilter(filter);
    setSelectedSpotId(undefined);
    if (filter !== "all") {
      setAdvancedFilters((prev) => ({ ...prev, waterTypes: [] }));
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters(initialFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    if (advancedFilters.waterTypes.length > 0) {
      setQuickFilter("all");
    }
  }, [advancedFilters.waterTypes]);

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

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
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
      {/* Map fills everything */}
      <div className="flex-1 relative">
        <SpotMap
          spots={filteredSpots}
          selectedSpotId={selectedSpotId}
          onSelectSpot={handleSelectSpot}
          onDeselectSpot={handleDeselectSpot}
          className="h-full w-full"
        />

        {/* Floating search + filters overlay */}
        <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pt-[max(1rem,env(safe-area-inset-top))] pointer-events-none">
          <div className="pointer-events-auto max-w-[430px] mx-auto space-y-2">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  type="text"
                  placeholder={t("searchSpotPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-11 rounded-full bg-card/90 backdrop-blur-md border shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowFiltersSheet(true)}
                className="w-11 h-11 rounded-full bg-card/90 backdrop-blur-md border shadow-sm flex items-center justify-center hover:bg-card transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Filter chips */}
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
                        : "bg-card/90 backdrop-blur-md border text-foreground hover:bg-card"
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

        {/* Spot bubble overlay */}
        {currentSpot && (
          <SpotBubble
            spot={currentSpot}
            isFavorite={isFavorite(currentSpot.id)}
            onToggleFavorite={handleToggleFavorite}
            onViewDetails={() => navigate(`/spots/${currentSpot.id}`)}
          />
        )}
      </div>

      <BottomNav />

      {/* Filters sheet */}
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
