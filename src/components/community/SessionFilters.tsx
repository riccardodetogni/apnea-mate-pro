import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SessionWithDetails } from "@/hooks/useSessions";

export type SessionFilterState = {
  dateRange: "all" | "today" | "tomorrow" | "thisWeek" | "nextWeek" | "custom";
  customFrom?: Date;
  customTo?: Date;
  spotName: string | null;
  paidFilter: "all" | "free" | "paid";
};

export const defaultSessionFilters: SessionFilterState = {
  dateRange: "all",
  spotName: null,
  paidFilter: "all",
};

interface SessionFiltersProps {
  sessions: SessionWithDetails[];
  filters: SessionFilterState;
  onFiltersChange: (f: SessionFilterState) => void;
}

const Chip = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
    )}
  >
    {icon}
    {label}
  </button>
);

export const SessionFilters = ({ sessions, filters, onFiltersChange }: SessionFiltersProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const spotNames = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach((s) => {
      if (s.spotName) names.add(s.spotName);
    });
    return Array.from(names).sort();
  }, [sessions]);

  const dateChips: { id: SessionFilterState["dateRange"]; label: string }[] = [
    { id: "all", label: t("filterAllDates") },
    { id: "today", label: t("filterToday") },
    { id: "tomorrow", label: t("filterTomorrow") },
    { id: "thisWeek", label: t("filterThisWeek") },
    { id: "nextWeek", label: t("filterNextWeek") },
  ];

  const paidChips: { id: SessionFilterState["paidFilter"]; label: string }[] = [
    { id: "all", label: t("filterAllSessions") },
    { id: "free", label: t("filterFree") },
    { id: "paid", label: t("filterPaid") },
  ];

  const customLabel = filters.dateRange === "custom" && filters.customFrom
    ? filters.customTo
      ? `${format(filters.customFrom, "dd/MM")} – ${format(filters.customTo, "dd/MM")}`
      : `${format(filters.customFrom, "dd/MM")} →`
    : t("filterCustomDate");

  return (
    <div className="space-y-1.5 mb-3">
      {/* Date chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {dateChips.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            active={filters.dateRange === c.id}
            onClick={() => onFiltersChange({ ...filters, dateRange: c.id, customFrom: undefined, customTo: undefined })}
          />
        ))}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                filters.dateRange === "custom"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {customLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Da</p>
              <Calendar
                mode="single"
                selected={filters.customFrom}
                onSelect={(d) => {
                  onFiltersChange({ ...filters, dateRange: "custom", customFrom: d || undefined });
                }}
                locale={it}
                className="p-0 pointer-events-auto"
              />
              <p className="text-xs text-muted-foreground font-medium">A</p>
              <Calendar
                mode="single"
                selected={filters.customTo}
                onSelect={(d) => {
                  onFiltersChange({ ...filters, dateRange: "custom", customTo: d || undefined });
                  if (d) setPopoverOpen(false);
                }}
                disabled={(date) => filters.customFrom ? date < filters.customFrom : false}
                locale={it}
                className="p-0 pointer-events-auto"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Spot chips */}
      {spotNames.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <Chip
            label={t("filterAllSpots")}
            active={filters.spotName === null}
            onClick={() => onFiltersChange({ ...filters, spotName: null })}
          />
          {spotNames.map((name) => (
            <Chip
              key={name}
              label={name}
              active={filters.spotName === name}
              onClick={() => onFiltersChange({ ...filters, spotName: name })}
            />
          ))}
        </div>
      )}

      {/* Paid/Free chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {paidChips.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            active={filters.paidFilter === c.id}
            onClick={() => onFiltersChange({ ...filters, paidFilter: c.id })}
          />
        ))}
      </div>
    </div>
  );
};
