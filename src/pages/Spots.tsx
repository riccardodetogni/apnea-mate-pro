import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import SpotFiltersSheet, { SpotFilters } from "@/components/spots/SpotFiltersSheet";
import MapItemBubble from "@/components/spots/MapItemBubble";
import { useSpots, SpotSession } from "@/hooks/useSpots";
import { useSpotFavorites } from "@/hooks/useSpotFavorites";
import { useEvents } from "@/hooks/useEvents";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Search, SlidersHorizontal, Heart, Plus, Calendar, GraduationCap } from "lucide-react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SpotMap, { SelectedMapItem } from "@/components/spots/SpotMap";

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

// Map session_type filter values to spot environment_type values.
const SESSION_TO_ENV: Record<string, string> = {
  sea_trip: "sea",
  pool_session: "pool",
  deep_pool_session: "deep_pool",
  lake_trip: "lake",
  spearfishing: "sea",
};

function spotMatchesFilters(
  spotEnvType: string,
  sessions: SpotSession[] | undefined,
  filters: SpotFilters,
): boolean {
  const hasLevel = filters.levels.length > 0;
  const hasDate = !!filters.dateFrom || !!filters.dateTo;
  const hasActivity = filters.activities.length > 0;

  // Activity-only filtering: also accept spot environment_type matches.
  if (hasActivity && !hasLevel && !hasDate) {
    const envMatches = filters.activities.some(
      (a) => SESSION_TO_ENV[a] === spotEnvType,
    );
    if (envMatches) return true;
  }

  // Level/date constraints (and combined filters) require a matching future session.
  if (!sessions || sessions.length === 0) return false;

  return sessions.some((s) => {
    const activityMatch =
      !hasActivity || filters.activities.includes(s.session_type);
    const levelMatch = !hasLevel || filters.levels.includes(s.level);
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
  const { events } = useEvents();
  const { courses } = useCourses();

  const [selected, setSelected] = useState<SelectedMapItem | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<SpotFilters>(initialFilters);
  const [showEvents, setShowEvents] = useState(true);
  const [showCourses, setShowCourses] = useState(true);

  const filteredSpots = useMemo(() => {
    let result = spots;

    if (quickFilter === "favorites") {
      result = result.filter((spot) => favoriteIds.includes(spot.id));
    }

    if (hasActiveFilters(advancedFilters)) {
      result = result.filter((spot) =>
        spotMatchesFilters(spot.environment_type, spotSessions[spot.id], advancedFilters)
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
    if (selected?.type !== "spot") return undefined;
    return filteredSpots.find((s) => s.id === selected.id);
  }, [filteredSpots, selected]);

  const currentEvent = useMemo(() => {
    if (selected?.type !== "event") return undefined;
    return events.find((e) => e.id === selected.id);
  }, [events, selected]);

  const currentCourse = useMemo(() => {
    if (selected?.type !== "course") return undefined;
    return courses.find((c) => c.id === selected.id);
  }, [courses, selected]);

  const handleSelect = useCallback((item: SelectedMapItem) => {
    setSelected(item);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelected(undefined);
  }, []);

  const handleQuickFilterChange = useCallback((filter: QuickFilterType) => {
    setQuickFilter(filter);
    setSelected(undefined);
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

  const eventPoints = useMemo(
    () =>
      showEvents
        ? events
            .filter((e) => e.latitude != null && e.longitude != null)
            .map((e) => ({ id: e.id, latitude: Number(e.latitude), longitude: Number(e.longitude), title: e.title }))
        : [],
    [events, showEvents],
  );

  const coursePoints = useMemo(
    () =>
      showCourses
        ? courses
            .filter((c) => c.latitude != null && c.longitude != null)
            .map((c) => ({ id: c.id, latitude: Number(c.latitude), longitude: Number(c.longitude), title: c.title }))
        : [],
    [courses, showCourses],
  );

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
          selected={selected}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
          className="h-full w-full"
          events={eventPoints}
          courses={coursePoints}
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
              <button
                onClick={() => setShowEvents((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors shadow-sm ${
                  showEvents
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/90 backdrop-blur-md border text-foreground hover:bg-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Eventi
              </button>
              <button
                onClick={() => setShowCourses((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors shadow-sm ${
                  showCourses
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/90 backdrop-blur-md border text-foreground hover:bg-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Corsi
              </button>
            </div>
          </div>
        </div>

        {(showEvents || showCourses) && (
          <div
            className="absolute left-3 z-[1000] pointer-events-none bg-background/85 backdrop-blur-md border rounded-lg px-2.5 py-1.5 shadow-sm text-[11px] space-y-0.5"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
          >
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(200, 80%, 50%)" }} />Spot</div>
            {showEvents && (
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(270, 70%, 55%)" }} />Eventi</div>
            )}
            {showCourses && (
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(30, 90%, 55%)" }} />Corsi</div>
            )}
          </div>
        )}

        {user && (
          <button
            onClick={() => navigate("/spots/new")}
            className="absolute right-4 z-[1000] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
            aria-label={t("addSpot")}
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {currentSpot && (
        <MapItemBubble
          item={{
            type: "spot",
            data: currentSpot,
            isFavorite: isFavorite(currentSpot.id),
            onToggleFavorite: handleToggleFavorite,
          }}
          onViewDetails={() => navigate(`/spots/${currentSpot.id}`)}
        />
      )}
      {currentEvent && (
        <MapItemBubble
          item={{ type: "event", data: currentEvent }}
          onViewDetails={() => navigate(`/events/${currentEvent.id}`)}
        />
      )}
      {currentCourse && (
        <MapItemBubble
          item={{ type: "course", data: currentCourse }}
          onViewDetails={() => navigate(`/courses/${currentCourse.id}`)}
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
