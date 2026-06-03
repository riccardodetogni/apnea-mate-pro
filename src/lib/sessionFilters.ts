import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from "date-fns";
import type { SessionFilterState } from "@/components/community/SessionFilters";

export function applySessionFilters<T extends { rawDateTime: string; spotName: string; isPaid?: boolean }>(
  list: T[],
  sessionFilters: SessionFilterState,
): T[] {
  let result = list;

  if (sessionFilters.dateRange !== "all") {
    const now = new Date();
    const today = startOfDay(now);
    let from: Date | undefined;
    let to: Date | undefined;

    switch (sessionFilters.dateRange) {
      case "today":
        from = today;
        to = endOfDay(now);
        break;
      case "tomorrow":
        from = startOfDay(addDays(now, 1));
        to = endOfDay(addDays(now, 1));
        break;
      case "thisWeek":
        from = startOfWeek(now, { weekStartsOn: 1 });
        to = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "nextWeek":
        from = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        to = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case "custom":
        from = sessionFilters.customFrom ? startOfDay(sessionFilters.customFrom) : undefined;
        to = sessionFilters.customTo ? endOfDay(sessionFilters.customTo) : undefined;
        break;
    }

    if (from || to) {
      result = result.filter((s) => {
        const sDate = new Date(s.rawDateTime);
        if (from && to) return isWithinInterval(sDate, { start: from, end: to });
        if (from) return sDate >= from;
        if (to) return sDate <= to;
        return true;
      });
    }
  }

  if (sessionFilters.spotName) {
    result = result.filter((s) => s.spotName === sessionFilters.spotName);
  }

  if (sessionFilters.paidFilter === "free") {
    result = result.filter((s) => !s.isPaid);
  } else if (sessionFilters.paidFilter === "paid") {
    result = result.filter((s) => s.isPaid);
  }

  return result;
}