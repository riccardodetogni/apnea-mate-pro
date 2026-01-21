import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { t } from "@/lib/i18n";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  loading?: boolean;
  nearbyFilterActive?: boolean;
  onToggleNearbyFilter?: () => void;
}

export const SearchBar = ({ 
  onSearch, 
  loading,
  nearbyFilterActive = false,
  onToggleNearbyFilter,
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onSearch?.(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch?.("");
  };

  return (
    <div className="flex gap-2.5 mb-4">
      {/* Search input */}
      <div className="search-bar relative">
        {loading ? (
          <Loader2 className="w-4 h-4 text-muted flex-shrink-0 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="border-none bg-transparent w-full text-sm text-foreground outline-none placeholder:text-muted"
        />
        {query && (
          <button 
            onClick={handleClear}
            className="p-1 hover:bg-secondary rounded-full"
          >
            <X className="w-3.5 h-3.5 text-muted" />
          </button>
        )}
      </div>

      {/* Near you filter chip */}
      <button 
        className={`chip-filter ${nearbyFilterActive ? 'bg-primary text-primary-foreground' : ''}`}
        onClick={onToggleNearbyFilter}
      >
        <MapPin className="w-4 h-4" />
        <span>{t("nearYou")}</span>
      </button>
    </div>
  );
};
