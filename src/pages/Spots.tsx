import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import SpotsMap from "@/components/spots/SpotsMap";
import SpotCard from "@/components/spots/SpotCard";
import SpotFiltersSheet from "@/components/spots/SpotFiltersSheet";
import SpotSearchBar from "@/components/spots/SpotSearchBar";
import { useSpots } from "@/hooks/useSpots";
import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

type QuickFilterType = "all" | "sea" | "lake" | "pool" | "favorites";

const initialFilters = {
  waterTypes: [] as string[],
  depthRanges: [] as string[],
  accessTypes: [] as string[],
  safetyFeatures: [] as string[],
  amenities: [] as string[],
};

const Spots = () => {
  const navigate = useNavigate();
  const { spots, loading, error } = useSpots();

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
    if (quickFilter !== "all" && quickFilter !== "favorites") {
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
  }, [spots, quickFilter, advancedFilters.waterTypes, searchQuery]);

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
      // Future: navigate to spot details page
      // navigate(`/spots/${currentSpot.id}`);
      console.log("View details for:", currentSpot.name);
    }
  }, [currentSpot]);

  const handleAddFavorite = useCallback(() => {
    if (currentSpot) {
      // Future: toggle favorite
      console.log("Toggle favorite for:", currentSpot.name);
    }
  }, [currentSpot]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4">
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
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Full-screen map */}
      <SpotsMap
        spots={filteredSpots}
        selectedSpotId={selectedSpotId}
        onSelectSpot={handleSelectSpot}
      />

      {/* Floating search bar */}
      <SpotSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={quickFilter}
        onFilterChange={handleQuickFilterChange}
        onOpenFilters={() => setShowFiltersSheet(true)}
      />

      {/* Bottom spot card */}
      {currentSpot && (
        <div className="absolute bottom-20 left-0 right-0 z-10">
          <SpotCard
            spot={currentSpot}
            currentIndex={currentSpotIndex}
            totalCount={filteredSpots.length}
            onPrevious={handlePreviousSpot}
            onNext={handleNextSpot}
            onViewDetails={handleViewSpotDetails}
            onAddFavorite={handleAddFavorite}
          />
        </div>
      )}

      {/* Empty state */}
      {filteredSpots.length === 0 && !loading && (
        <div className="absolute bottom-20 left-0 right-0 z-10 mx-4 mb-4">
          <div className="bg-card/95 backdrop-blur-xl rounded-[18px] border shadow-lg p-6 text-center">
            <p className="text-muted">{t("noMoreSessions")}</p>
          </div>
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

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
};

export default Spots;
