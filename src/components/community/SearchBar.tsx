import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  loading?: boolean;
}

export const SearchBar = ({ onSearch, loading }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="flex gap-2.5 mb-4">
      {/* Search input */}
      <div className="search-bar">
        {loading ? (
          <Loader2 className="w-4 h-4 text-muted flex-shrink-0 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={t("searchPlaceholder")}
          className="border-none bg-transparent w-full text-sm text-foreground outline-none placeholder:text-muted"
        />
      </div>

      {/* Near you filter chip */}
      <button className="chip-filter">
        <MapPin className="w-4 h-4" />
        <span>{t("nearYou")}</span>
      </button>
    </div>
  );
};
