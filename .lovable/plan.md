

# Fullscreen Map Layout for Spots Tab

## Overview
Transform the Spots tab from a scrollable page with a contained map into a fullscreen, immersive map experience. The map fills the entire screen behind a floating search bar and filter chips. When a spot marker is tapped, a thin, elegant bubble slides up from the bottom showing brief details and a link to available sessions.

## Current State
- The Spots page uses `AppLayout` which wraps content in a padded container (`max-w-[430px], px-4, pt-4, pb-24`)
- The map is a 300px tall contained box within the scrollable page
- Below the map sits a full `SpotCard` component with navigation arrows, description, and action buttons
- Search bar and filter chips live above the map in the normal flow

## New Layout

```text
+----------------------------------+
|  [Search bar]         [Filter]   |  <- Floating, translucent
|  [All] [Sea] [Lake] [Pool] ...   |  <- Floating filter chips
|                                  |
|         FULLSCREEN MAP           |
|        (fills viewport)          |
|                                  |
|                                  |
|  +----------------------------+  |
|  | Spot Name          [Heart] |  |  <- Slide-up bubble
|  | Location    [Sessions (3)] |  |
|  +----------------------------+  |
|                                  |
|      [ Bottom Navigation ]       |
+----------------------------------+
```

## Changes

### 1. `src/pages/Spots.tsx` -- Major restructure
- Stop using `AppLayout` wrapper (which adds padding and constrains width)
- Instead, render the `BottomNav` manually and use a custom fullscreen layout
- The map becomes the base layer filling the entire viewport
- Search bar and filter chips become absolutely positioned overlays at the top with a subtle backdrop blur
- Remove the `SpotCard` + pagination controls at the bottom
- When a spot is selected (via marker tap), show a new `SpotBubble` component anchored to the bottom
- When tapping an empty area of the map or deselecting, hide the bubble
- Keep filter sheet functionality as-is

### 2. `src/components/spots/SpotMap.tsx` -- Adapt to fullscreen
- Change the container height from `h-[300px]` to `h-full` so it fills its parent
- Remove the Leaflet popup on marker click (the bubble replaces it)
- When a marker is clicked, only call `onSelectSpot` without showing a popup
- Add an `onDeselectSpot` callback: clicking on the map (not a marker) clears the selection
- Remove rounded corners and border (fullscreen, no card frame)

### 3. New: `src/components/spots/SpotBubble.tsx`
A thin, elegant floating card that appears at the bottom when a spot is selected:
- Slides up with a smooth CSS transition
- Shows: environment emoji, spot name, location (truncated), and a heart/favorite button
- If the spot has active sessions, show a prominent "Sessioni disponibili" link/button that navigates to the spot details page
- If no sessions, show a subtle "Vedi dettagli" link instead
- Tapping the bubble itself navigates to the spot detail page
- Positioned above the bottom nav with appropriate spacing

### 4. `src/components/spots/SpotCard.tsx` -- No changes
This component is still used on other pages; we just stop using it in Spots.tsx.

## Technical Details

### Spots.tsx structure (pseudo-JSX):
```tsx
// No AppLayout -- custom fullscreen layout
<div className="fixed inset-0 flex flex-col">
  {/* Map fills everything */}
  <div className="flex-1 relative">
    <SpotMap
      spots={filteredSpots}
      selectedSpotId={selectedSpotId}
      onSelectSpot={handleSelectSpot}
      onDeselectSpot={() => setSelectedSpotId(undefined)}
      className="h-full w-full"
    />

    {/* Floating search + filters overlay */}
    <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-[430px] mx-auto">
        {/* Search bar + filter button */}
        {/* Filter chips row */}
      </div>
    </div>

    {/* Spot bubble overlay */}
    {currentSpot && (
      <SpotBubble
        spot={currentSpot}
        isFavorite={isFavorite(currentSpot.id)}
        onToggleFavorite={handleAddFavorite}
        onViewDetails={() => navigate(`/spots/${currentSpot.id}`)}
        onClose={() => setSelectedSpotId(undefined)}
      />
    )}
  </div>

  <BottomNav />
</div>
```

### SpotBubble.tsx design:
```tsx
// Positioned at bottom, above bottom nav
<div className="absolute bottom-20 left-4 right-4 z-20
                max-w-[430px] mx-auto">
  <div className="bg-card/95 backdrop-blur-lg rounded-2xl border
                  shadow-lg p-4 flex items-center gap-3
                  animate-in slide-in-from-bottom duration-300">
    {/* Env emoji */}
    <div className="w-12 h-12 rounded-xl bg-primary/10
                    flex items-center justify-center text-2xl">
      {emoji}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-foreground truncate">
        {spot.name}
      </h3>
      <p className="text-xs text-muted truncate flex items-center gap-1">
        <MapPin size={12} /> {spot.location}
      </p>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      {spot.hasActiveSessions && (
        <button onClick={onViewDetails}
                className="text-xs text-primary font-medium
                           whitespace-nowrap">
          Sessioni disponibili
        </button>
      )}
      <button onClick={onToggleFavorite}>
        <Heart filled={isFavorite} />
      </button>
    </div>
  </div>
</div>
```

### SpotMap.tsx changes:
- Remove `bindPopup(...)` from markers
- Add click handler on the map itself to deselect: `mapRef.current.on('click', () => onDeselectSpot?.())`
- Accept optional `className` prop for flexible sizing
- Remove hardcoded `h-[300px]`, `rounded-lg`, `border` classes

### i18n additions:
- `availableSessions`: "Sessioni disponibili" / "Available sessions"
- `viewDetails`: "Vedi dettagli" / "View details" (if not already present)

## Files to Modify
| File | Action |
|------|--------|
| `src/pages/Spots.tsx` | Major rewrite -- fullscreen map layout |
| `src/components/spots/SpotMap.tsx` | Remove popup, add deselect, flexible sizing |
| `src/components/spots/SpotBubble.tsx` | New component -- floating spot info card |
| `src/lib/i18n.ts` | Add 1-2 new translation keys |

