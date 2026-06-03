import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  isWithinInterval,
} from "date-fns";

export type DateRange = "all" | "today" | "thisWeek" | "thisMonth" | "nextMonth";

interface DateRangeChipsProps {
  value: DateRange;
  onChange: (v: DateRange) => void;
}

export const DateRangeChips = ({ value, onChange }: DateRangeChipsProps) => {
  const chips: { id: DateRange; label: string }[] = [
    { id: "all", label: t("filterAllDates") },
    { id: "today", label: t("filterToday") },
    { id: "thisWeek", label: t("filterThisWeek") },
    { id: "thisMonth", label: t("filterThisMonth") },
    { id: "nextMonth", label: t("filterNextMonth") },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
      {chips.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
            value === c.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};

export function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (range === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  let from: Date;
  let to: Date;
  switch (range) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case "thisWeek":
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "thisMonth":
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case "nextMonth":
      from = startOfMonth(addMonths(now, 1));
      to = endOfMonth(addMonths(now, 1));
      break;
  }
  return isWithinInterval(d, { start: from, end: to });
}