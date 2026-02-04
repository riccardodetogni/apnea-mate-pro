import { t } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface SpotFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    waterTypes: string[];
    depthRanges: string[];
    accessTypes: string[];
    safetyFeatures: string[];
    amenities: string[];
  };
  onFiltersChange: (filters: SpotFiltersSheetProps["filters"]) => void;
  onReset: () => void;
  onApply: () => void;
}

const waterTypeOptions = [
  { id: "sea", label: "sea" },
  { id: "lake", label: "lake" },
  { id: "pool", label: "pool" },
  { id: "deep_pool", label: "deepPool" },
];

const depthOptions = [
  { id: "0-20", label: "depth0to20" },
  { id: "20-40", label: "depth20to40" },
  { id: "40+", label: "depth40plus" },
];

const accessOptions = [
  { id: "easy", label: "accessEasy" },
  { id: "boat", label: "accessBoatOnly" },
];

const safetyOptions = [
  { id: "buoy", label: "buoyPresent" },
  { id: "staff", label: "safetyStaff" },
];

const amenityOptions = [
  { id: "parking", label: "parkingNearby" },
  { id: "showers", label: "showersAvailable" },
];

const FilterSection = ({
  title,
  subtitle,
  options,
  selected,
  onChange,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) => {
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className={`space-y-2 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
        {subtitle && (
          <p className="text-xs text-muted">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => !disabled && toggleOption(option.id)}
              disabled={disabled}
              className={`
                px-3 py-1.5 rounded-full text-sm border transition-colors
                ${isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
                }
                ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {t(option.label as any)}
            </button>
          );
        })}
      </div>
      {disabled && (
        <p className="text-xs text-muted italic">{t("comingSoon")}</p>
      )}
    </div>
  );
};

const SpotFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onReset,
  onApply,
}: SpotFiltersSheetProps) => {
  const updateFilter = (key: keyof typeof filters, values: string[]) => {
    onFiltersChange({ ...filters, [key]: values });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[80vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-lg">{t("filtersTitle")}</SheetTitle>
          <SheetDescription className="text-sm">
            {t("filtersSubtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Water Type - Functional */}
          <FilterSection
            title={t("waterType")}
            subtitle={t("waterTypeHelp")}
            options={waterTypeOptions}
            selected={filters.waterTypes}
            onChange={(values) => updateFilter("waterTypes", values)}
          />

          {/* Max Depth - Coming Soon */}
          <FilterSection
            title={t("maxDepth")}
            subtitle={t("maxDepthHelp")}
            options={depthOptions}
            selected={filters.depthRanges}
            onChange={(values) => updateFilter("depthRanges", values)}
            disabled
          />

          {/* Access Type - Coming Soon */}
          <FilterSection
            title={t("accessType")}
            options={accessOptions}
            selected={filters.accessTypes}
            onChange={(values) => updateFilter("accessTypes", values)}
            disabled
          />

          {/* Safety - Coming Soon */}
          <FilterSection
            title={t("safety")}
            options={safetyOptions}
            selected={filters.safetyFeatures}
            onChange={(values) => updateFilter("safetyFeatures", values)}
            disabled
          />

          {/* Amenities - Coming Soon */}
          <FilterSection
            title={t("amenities")}
            options={amenityOptions}
            selected={filters.amenities}
            onChange={(values) => updateFilter("amenities", values)}
            disabled
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-8 pb-4">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onReset}
          >
            {t("resetFilters")}
          </Button>
          <Button
            variant="pill"
            className="flex-1"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
          >
            {t("applyFilters")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SpotFiltersSheet;
