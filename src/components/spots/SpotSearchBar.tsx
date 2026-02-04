import { t } from "@/lib/i18n";
import { Search, SlidersHorizontal, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";

type FilterType = "all" | "sea" | "lake" | "pool" | "favorites";

interface SpotSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onOpenFilters: () => void;
}

const filterOptions: { id: FilterType; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "filterAll" },
  { id: "sea", label: "filterSea" },
  { id: "lake", label: "filterLake" },
  { id: "pool", label: "filterPool" },
  { id: "favorites", label: "filterFavorites", icon: <Heart className="w-3.5 h-3.5" /> },
];

const SpotSearchBar = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onOpenFilters,
}: SpotSearchBarProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-safe">
      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            type="text"
            placeholder={t("searchSpotPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 h-11 rounded-full bg-card/95 backdrop-blur-xl border"
          />
        </div>
        <button
          onClick={onOpenFilters}
          className="w-11 h-11 rounded-full bg-card/95 backdrop-blur-xl border flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors
                ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/95 backdrop-blur-xl border text-foreground hover:border-primary/50"
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
  );
};

export default SpotSearchBar;
