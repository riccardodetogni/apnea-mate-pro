import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import SpotCard from "@/components/spots/SpotCard";
import SpotFiltersSheet from "@/components/spots/SpotFiltersSheet";
import { useSpots } from "@/hooks/useSpots";
import { useSpotFavorites } from "@/hooks/useSpotFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Search, SlidersHorizontal, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SpotMap from "@/components/spots/SpotMap";

type QuickFilterType = "all" | "sea" | "lake" | "pool" | "favorites";

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

  // Filter spots based on search and filters
  const filteredSpots = useMemo(() => {
    let result = spots;

    // Quick filter
    if (quickFilter === "favorites") {
      result = result.filter((spot) => favoriteIds.includes(spot.id));
    } else if (quickFilter !== "all") {
      result = result.filter((spot) => spot.environment_type === quickFilter);
    }

    // Advanced water type filter (only if quick filter is "all")
    if (quickFilter === "all" && advancedFilters.waterTypes.length > 0) {
      result = result.filter((spot) =>
        advancedFilters.waterTypes.includes(spot.environment_type)
      );
    }

    // Search filter
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

  // Current spot index for bottom card
  const currentSpotIndex = useMemo(() => {
    if (!selectedSpotId) return 0;
    const index = filteredSpots.findIndex((s) => s.id === selectedSpotId);
    return index >= 0 ? index : 0;
  }, [filteredSpots, selectedSpotId]);

  // Current spot to display
  const currentSpot = filteredSpots[currentSpotIndex];

  // Auto-select first spot when filter changes
  useMemo(() => {
    if (filteredSpots.length > 0 && !selectedSpotId) {
      setSelectedSpotId(filteredSpots[0].id);
    } else if (filteredSpots.length > 0 && !filteredSpots.find((s) => s.id === selectedSpotId)) {
      setSelectedSpotId(filteredSpots[0].id);
    }
  }, [filteredSpots, selectedSpotId]);

  // Handlers
  const handleSelectSpot = useCallback((spotId: string) => {
    setSelectedSpotId(spotId);
  }, []);

  const handlePreviousSpot = useCallback(() => {
    if (currentSpotIndex > 0) {
      setSelectedSpotId(filteredSpots[currentSpotIndex - 1].id);
    }
  }, [currentSpotIndex, filteredSpots]);

  const handleNextSpot = useCallback(() => {
    if (currentSpotIndex < filteredSpots.length - 1) {
      setSelectedSpotId(filteredSpots[currentSpotIndex + 1].id);
    }
  }, [currentSpotIndex, filteredSpots]);

  const handleQuickFilterChange = useCallback((filter: QuickFilterType) => {
    setQuickFilter(filter);
    // Reset selection when changing filters
    setSelectedSpotId(undefined);
    // Reset advanced water types when using quick filter
    if (filter !== "all") {
      setAdvancedFilters((prev) => ({ ...prev, waterTypes: [] }));
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters(initialFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    // If water types selected in advanced, reset quick filter
    if (advancedFilters.waterTypes.length > 0) {
      setQuickFilter("all");
    }
  }, [advancedFilters.waterTypes]);

  const handleViewSpotDetails = useCallback(() => {
    if (currentSpot) {
      // Navigate to spot details (future: /spots/:id)
      toast.info(`${t("viewSpotDetails")}: ${currentSpot.name}`, {
        description: t("comingSoon"),
      });
    }
  }, [currentSpot]);

  const handleAddFavorite = useCallback(() => {
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
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive mb-4">{t("error")}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary underline"
          >
            {t("retry")}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("discoverSpots")}</h1>
      </header>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            type="text"
            placeholder={t("searchSpotPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-11 rounded-full"
          />
        </div>
        <button
          onClick={() => setShowFiltersSheet(true)}
          className="w-11 h-11 rounded-full bg-card border flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
        {filterOptions.map((filter) => {
          const isActive = quickFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => handleQuickFilterChange(filter.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors
                ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border text-foreground hover:border-primary/50"
                }
              `}
            >
              {filter.icon}
              {t(filter.label as any)}
            </button>
          );
        })}
      </div>

      {/* Map - contained */}
      <div className="rounded-2xl overflow-hidden border mb-4">
        <SpotMap
          spots={filteredSpots}
          selectedSpotId={selectedSpotId}
          onSelectSpot={handleSelectSpot}
        />
      </div>

      {/* Spot card navigation */}
      {currentSpot && (
        <div className="bg-card rounded-2xl border p-4">
          {/* Pagination controls */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePreviousSpot}
              disabled={currentSpotIndex === 0}
              className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted" />
            </button>
            
            <span className="text-sm text-muted">
              {currentSpotIndex + 1} {t("spotOf")} {filteredSpots.length}
            </span>
            
            <button
              onClick={handleNextSpot}
              disabled={currentSpotIndex === filteredSpots.length - 1}
              className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Spot info */}
          <SpotCard
            spot={currentSpot}
            currentIndex={currentSpotIndex}
            totalCount={filteredSpots.length}
            onPrevious={handlePreviousSpot}
            onNext={handleNextSpot}
            onViewDetails={handleViewSpotDetails}
            onAddFavorite={handleAddFavorite}
            isFavorite={isFavorite(currentSpot.id)}
            hideNavigation
          />
        </div>
      )}

      {/* Empty state */}
      {filteredSpots.length === 0 && !loading && (
        <div className="bg-card rounded-2xl border p-6 text-center">
          <p className="text-muted">
            {quickFilter === "favorites"
              ? "Nessuno spot nei preferiti"
              : "Nessuno spot trovato"}
          </p>
        </div>
      )}

      {/* Filters sheet */}
      <SpotFiltersSheet
        open={showFiltersSheet}
        onOpenChange={setShowFiltersSheet}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
      />
    </AppLayout>
  );
};

export default Spots;
