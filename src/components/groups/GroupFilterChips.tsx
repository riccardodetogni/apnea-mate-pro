import { t } from "@/lib/i18n";

export type GroupFilter = "all" | "schools" | "myGroups" | "nearby";

interface GroupFilterChipsProps {
  activeFilter: GroupFilter;
  onFilterChange: (filter: GroupFilter) => void;
}

export const GroupFilterChips = ({ activeFilter, onFilterChange }: GroupFilterChipsProps) => {
  const filters: { id: GroupFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "schools", label: t("filterSchools") },
    { id: "myGroups", label: t("filterYourGroups") },
    { id: "nearby", label: t("filterNearby") },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeFilter === filter.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};
