

# Spots Page - Complete Implementation Plan

Based on the HTML mockups and current codebase analysis, here's the comprehensive plan to transform the placeholder Spots page into a fully functional map-based spot discovery feature.

---

## Current State Analysis

**What exists:**
- `spots` table with: id, name, environment_type, location, latitude, longitude, description, created_by
- `useSpots.ts` hook with basic fetch logic
- `SpotMap.tsx` component (used in session creation, not suitable for full-page view)
- `SpotCreator.tsx` component for adding new spots
- `Spots.tsx` page showing static grid cards as placeholder

**What the mockups show:**

1. **Main Spots Page (6.0):**
   - Full-screen interactive map with dark theme
   - Floating search bar at top
   - Quick filter chips (Tutti, Mare, Lago, Piscina, Preferiti)
   - Filter settings button
   - Colored map pins based on spot type
   - Bottom card carousel with spot details
   - Pagination indicator

2. **Filters Sheet (6.1):**
   - Bottom sheet modal
   - Multi-select filter sections for various attributes
   - Reset and Apply buttons

---

## Database Schema Considerations

The mockups show filter options for:
- Max depth
- Access type (easy, boat only)
- Safety features (buoy present, safety staff)
- Amenities (parking, showers)

**Option 1 (Recommended for V1):** Work with existing schema
- Use `environment_type` for water type filtering
- Skip advanced filters for now (depth, access, safety, services)
- Add these columns in a future iteration when needed

**Option 2:** Extend database with new columns
- Would require migration for: `max_depth`, `access_type`, `has_buoy`, `has_safety_staff`, `has_parking`, `has_showers`

For V1, I recommend **Option 1** to avoid scope creep. The filters sheet can show the sections but some will be "coming soon" or we filter client-side based on available data.

---

## Implementation Plan

### Phase 1: Spots Page Refactor

**File: `src/pages/Spots.tsx`**

Complete redesign from placeholder to map-centric view:
- Full-screen map (no AppLayout wrapper - custom layout for immersive experience)
- Floating search bar at top
- Quick filter chips below search
- Settings button for filters sheet
- Map fills the screen
- Bottom spot card carousel

Key features:
- Use vanilla Leaflet (as per existing pattern in SpotMap.tsx)
- Custom colored markers based on environment_type
- Selected spot highlighting
- Swipe between spots with bottom card

---

### Phase 2: New Components

| Component | Description |
|-----------|-------------|
| `src/components/spots/SpotsMap.tsx` | Full-screen map component with colored markers |
| `src/components/spots/SpotCard.tsx` | Bottom carousel card showing spot details |
| `src/components/spots/SpotFiltersSheet.tsx` | Bottom sheet with filter options |
| `src/components/spots/SpotSearchBar.tsx` | Floating search input with filter chips |

---

### Phase 3: Component Details

**SpotsMap.tsx:**
- Full-screen Leaflet map
- Custom marker colors:
  - Blue (#2563EB) for sea/lake
  - Green (#22C55E) for deep_pool
  - Orange (#F97316) for pool
- Click marker to select spot
- Fit bounds to show all spots

**SpotCard.tsx:**
- Swipeable card at bottom
- Shows: photo placeholder, type, name, location, tags
- Buttons: "Vedi dettagli spot", "Aggiungi ai preferiti"
- Pagination indicator (1 di N)

**SpotFiltersSheet.tsx:**
- Uses existing Sheet component
- Filter sections matching mockup
- For V1: only environment_type filter is functional
- Other sections shown with disabled state or "coming soon"

**SpotSearchBar.tsx:**
- Floating search input
- Filters spots by name/location
- Quick chip toggles for environment types

---

### Phase 4: State Management

The Spots page will manage:
- `selectedSpotId` - currently selected spot
- `activeFilters` - environment types, favorites (future)
- `searchQuery` - text search
- `showFilters` - filters sheet visibility
- `spotIndex` - for pagination in bottom cards

---

### Phase 5: Favorites System (Future)

The mockup shows "Preferiti" (Favorites) filter. This would require:
- New `spot_favorites` table (user_id, spot_id)
- Toggle favorite on spot card
- Filter by favorites

For V1, we'll show the UI but make it non-functional or skip it.

---

### Phase 6: i18n Updates

Add translation keys for spots page:

```typescript
// Spots page
searchSpotPlaceholder: "Cerca spot o zona",
filterAll: "Tutti",
filterSea: "Mare",
filterLake: "Lago",
filterPool: "Piscina",
filterFavorites: "Preferiti",
filtersTitle: "Filtri spot",
filtersSubtitle: "Affina gli spot visibili sulla mappa.",
waterType: "Tipologia acqua",
waterTypeHelp: "Puoi selezionare più opzioni.",
maxDepth: "Profondità massima",
maxDepthHelp: "Indicativa, basata sulle informazioni disponibili.",
depth0to20: "0–20 m",
depth20to40: "20–40 m",
depth40plus: "40+ m",
accessType: "Accesso",
accessEasy: "Accesso facile",
accessBoatOnly: "Solo barca",
safety: "Sicurezza",
buoyPresent: "Boa presente",
safetyStaff: "Safety spot / staff",
amenities: "Servizi",
parkingNearby: "Parcheggio vicino",
showersAvailable: "Docce / servizi",
resetFilters: "Reset filtri",
applyFilters: "Applica filtri",
viewSpotDetails: "Vedi dettagli spot",
addToFavorites: "Aggiungi ai preferiti",
spotOf: "di",
comingSoon: "Prossimamente",
```

---

### Phase 7: Routing Update

The Spots page doesn't need new routes for V1, but we should prepare for:
- `/spots/:id` - Spot detail page (future)

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/spots/SpotsMap.tsx` | Full-screen map with colored markers |
| `src/components/spots/SpotCard.tsx` | Bottom card carousel item |
| `src/components/spots/SpotFiltersSheet.tsx` | Filters bottom sheet |
| `src/components/spots/SpotSearchBar.tsx` | Floating search with chips |

## Files to Update

| File | Changes |
|------|---------|
| `src/pages/Spots.tsx` | Complete rewrite to map-based UI |
| `src/lib/i18n.ts` | Add spots-related translations |
| `src/hooks/useSpots.ts` | Add filtering support |

---

## UI/UX Details

**Map styling:**
- Dark gradient background matching mockup
- OpenStreetMap tiles (or dark theme tiles if available)
- Custom circular markers with icons

**Bottom card:**
- Glass-morphism style (semi-transparent white background)
- Rounded corners (18px)
- Shadow for elevation
- Horizontal swipe for pagination (using existing carousel or custom)

**Filters sheet:**
- Slides up from bottom
- Handle bar at top
- Matches mockup exactly
- Chips toggle on/off

---

## Technical Architecture

```text
Spots Page
├── SpotsMap (full screen)
│   └── Leaflet with custom markers
├── SpotSearchBar (floating, z-index above map)
│   ├── Search input
│   ├── Filter chips
│   └── Settings button
├── SpotCard (bottom overlay)
│   ├── Pagination indicator
│   └── Card content
└── SpotFiltersSheet (bottom sheet modal)
    └── Filter sections
```

---

## Summary

This plan transforms the Spots page from a placeholder grid into an immersive map-based discovery experience:

1. **Full-screen map** with colored markers for each spot type
2. **Floating search** with quick filter chips
3. **Bottom card carousel** showing spot details
4. **Filters sheet** for advanced filtering (V1: environment type only)

The implementation follows existing patterns (vanilla Leaflet, Sheet component) and maintains the dark gradient aesthetic from the mockups.

