

# Session Filters — Single Row + Filter Sheet

## Summary

Replace the current three-row chip layout with a single scrollable row of date chips plus a filter icon button. Tapping the filter icon opens a bottom sheet containing the spot and paid/free filters. An active-filter badge on the icon indicates when non-default filters are applied.

## UX

```text
Sessions for you                                 Vedi tutto →
┌────────────────────────────────────────────────────────┐
│ [Tutti] [Oggi] [Domani] [Settimana] [Custom▾]  [⚙ •] │
└────────────────────────────────────────────────────────┘
                                                   ↑ badge if filters active

Bottom sheet (on filter icon tap):
┌──────────────────────────────┐
│  Filtri                      │
│                              │
│  Spot                        │
│  [Tutti] [Spot A] [Spot B]   │
│                              │
│  Tipo                        │
│  [Tutte] [Gratuite] [A pag.] │
│                              │
│  [Applica]      [Reset]      │
└──────────────────────────────┘
```

## Changes

### 1. `src/components/community/SessionFilters.tsx`
- Keep the single date chips row (with custom date popover) as-is
- Remove the spot and paid/free chip rows from the main render
- Add a filter icon button (`SlidersHorizontal` from lucide) at the end of the date row
- Show a small colored dot on the icon when `spotName !== null || paidFilter !== "all"`
- On icon tap, open a `Drawer` (bottom sheet) containing:
  - Spot chips (same logic, derived from sessions)
  - Paid/free chips
  - "Applica" button that closes the sheet
  - "Reset" link that resets spot + paid filters to defaults

### 2. `src/lib/i18n.ts`
- Add keys: `filterApply` ("Applica"/"Apply"), `filterReset` ("Reset"/"Reset"), `filterTitle` ("Filtri"/"Filters"), `filterType` ("Tipo"/"Type")

### Files
- `src/components/community/SessionFilters.tsx` — refactor layout
- `src/lib/i18n.ts` — add 4 keys

No other files change. Same `SessionFilterState` type, same filtering logic in `Community.tsx`.

