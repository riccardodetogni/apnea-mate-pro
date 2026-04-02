

# Session Filters for Community Page

## Summary

Add a horizontal scrollable filter bar below the "Sessions for you" section header. Three filter dimensions: date (quick chips + custom range), spot name, and paid/free. All client-side filtering on existing data.

## UX

```text
Sessions for you                          Vedi tutto →
┌──────────────────────────────────────────────────┐
│ [Tutti] [Oggi] [Domani] [Settimana] [Custom ▾]  │  ← date chips
│ [Tutti gli spot] [Spot A] [Spot B] [Spot C]      │  ← spot chips (dynamic)
│ [Tutte] [Gratuite] [A pagamento]                 │  ← paid/free chips
└──────────────────────────────────────────────────┘
  ← scrollable session cards →
```

- **Date chips**: "Tutti", "Oggi", "Domani", "Questa settimana", "Prossima settimana", "Personalizza…" (opens a popover with date range picker)
- **Spot chips**: dynamically built from the spots present in the current session list. "Tutti gli spot" + one chip per unique spot name
- **Paid/Free chips**: "Tutte", "Gratuite", "A pagamento"
- All chips follow same pill style as `GroupFilterChips`
- Filters are AND-combined (date AND spot AND paid)

## Changes

### 1. New: `src/components/community/SessionFilters.tsx`
- Props: `{ sessions: SessionWithDetails[], filters: SessionFilterState, onFiltersChange: (f: SessionFilterState) => void }`
- `SessionFilterState = { dateRange: "all" | "today" | "tomorrow" | "thisWeek" | "nextWeek" | "custom"; customFrom?: Date; customTo?: Date; spotName: string | null; paidFilter: "all" | "free" | "paid" }`
- Three rows of scrollable chips
- "Personalizza" chip opens a `Popover` with two `Calendar` components (from/to) for custom range
- Derives unique spot names from sessions prop

### 2. `src/pages/Community.tsx`
- Add `sessionFilters` state with `SessionFilterState`
- Render `<SessionFilters>` between `SectionHeader` and the scroll-row
- Apply filters to `availableSessions` after distance sorting:
  - Date: filter by comparing `session.dateTime` against computed date boundaries
  - Spot: filter by `session.spotName === filter.spotName`
  - Paid: filter by `session.isPaid` / `!session.isPaid`

### 3. `src/lib/i18n.ts`
- Add keys: `filterToday` ("Oggi"/"Today"), `filterTomorrow` ("Domani"/"Tomorrow"), `filterThisWeek` ("Questa settimana"/"This week"), `filterNextWeek` ("Prossima settimana"/"Next week"), `filterCustomDate` ("Personalizza"/"Custom"), `filterAllSpots` ("Tutti gli spot"/"All spots"), `filterAllSessions` ("Tutte"/"All"), `filterFree` ("Gratuite"/"Free"), `filterPaid` ("A pagamento"/"Paid"), `filterAllDates` ("Tutte le date"/"All dates")

### Technical notes
- Pure client-side filtering — no DB changes
- Spot chips are derived dynamically from the fetched sessions, so they update as data changes
- Custom date range uses the existing shadcn `Calendar` + `Popover` components
- Filter state resets when navigating away (local component state)

