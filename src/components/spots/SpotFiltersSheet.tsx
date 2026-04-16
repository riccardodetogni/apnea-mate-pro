import { useState } from "react";
import { format, startOfDay, endOfDay, addDays, endOfWeek, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { getSessionTypes, getLevels } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SpotFilters {
  activities: string[];
  levels: string[];
  dateFrom?: string;
  dateTo?: string;
}

interface SpotFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SpotFilters;
  onFiltersChange: (filters: SpotFilters) => void;
  onReset: () => void;
  onApply: () => void;
}

type DateQuick = "all" | "today" | "tomorrow" | "thisWeek";

const ChipSelect = ({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-foreground text-sm">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                isSelected
                  ? "bg-card text-card-foreground border-card"
                  : "bg-secondary text-secondary-foreground border-border hover:border-card/50 cursor-pointer"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
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
  const [dateQuick, setDateQuick] = useState<DateQuick>("all");

  const sessionTypes = getSessionTypes();
  const levels = getLevels();

  const updateFilter = <K extends keyof SpotFilters>(key: K, value: SpotFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateQuick = (q: DateQuick) => {
    setDateQuick(q);
    const now = new Date();
    if (q === "all") {
      updateFilter("dateFrom", undefined);
      onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined });
    } else if (q === "today") {
      onFiltersChange({ ...filters, dateFrom: startOfDay(now).toISOString(), dateTo: endOfDay(now).toISOString() });
    } else if (q === "tomorrow") {
      const tom = addDays(now, 1);
      onFiltersChange({ ...filters, dateFrom: startOfDay(tom).toISOString(), dateTo: endOfDay(tom).toISOString() });
    } else if (q === "thisWeek") {
      onFiltersChange({ ...filters, dateFrom: startOfDay(now).toISOString(), dateTo: endOfWeek(now, { weekStartsOn: 1 }).toISOString() });
    }
  };

  const dateFromDate = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  const dateToDate = filters.dateTo ? new Date(filters.dateTo) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[80vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-lg">{t("filtersTitle")}</SheetTitle>
          <SheetDescription className="text-sm">
            {t("filtersSubtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Activity */}
          <ChipSelect
            title={t("filterActivity")}
            options={sessionTypes}
            selected={filters.activities}
            onChange={(v) => updateFilter("activities", v)}
          />

          {/* Level */}
          <ChipSelect
            title={t("filterLevel")}
            options={levels}
            selected={filters.levels}
            onChange={(v) => updateFilter("levels", v)}
          />

          {/* Date */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground text-sm">{t("filterDate")}</h4>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {([
                { id: "all" as DateQuick, label: t("filterAllDates") },
                { id: "today" as DateQuick, label: t("filterToday") },
                { id: "tomorrow" as DateQuick, label: t("filterTomorrow") },
                { id: "thisWeek" as DateQuick, label: t("filterThisWeek") },
              ]).map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleDateQuick(chip.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-colors",
                    dateQuick === chip.id
                      ? "bg-card text-card-foreground border-card"
                      : "bg-secondary text-secondary-foreground border-border hover:border-card/50 cursor-pointer"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* From/To pickers */}
            <div className="flex gap-3 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal text-sm h-10",
                      !dateFromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFromDate ? format(dateFromDate, "dd MMM", { locale: it }) : t("dateFrom")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFromDate}
                    onSelect={(d) => {
                      setDateQuick("all");
                      onFiltersChange({
                        ...filters,
                        dateFrom: d ? startOfDay(d).toISOString() : undefined,
                      });
                    }}
                    disabled={(d) => d < startOfDay(new Date())}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal text-sm h-10",
                      !dateToDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateToDate ? format(dateToDate, "dd MMM", { locale: it }) : t("dateTo")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={dateToDate}
                    onSelect={(d) => {
                      setDateQuick("all");
                      onFiltersChange({
                        ...filters,
                        dateTo: d ? endOfDay(d).toISOString() : undefined,
                      });
                    }}
                    disabled={(d) => d < startOfDay(dateFromDate || new Date())}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-8 pb-4">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => {
              setDateQuick("all");
              onReset();
            }}
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
