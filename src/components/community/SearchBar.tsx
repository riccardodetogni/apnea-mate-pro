import { Search, MapPin } from "lucide-react";
import { t } from "@/lib/i18n";

export const SearchBar = () => {
  return (
    <div className="flex gap-2.5 mb-4">
      {/* Search input */}
      <div className="search-bar">
        <Search className="w-4 h-4 text-muted flex-shrink-0" />
        <input
          type="text"
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
