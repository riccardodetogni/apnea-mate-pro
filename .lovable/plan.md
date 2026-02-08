
# Fix Map Movement on Spot Click

## Problem
Two issues with the current marker click behavior (line 144):

1. **Unwanted zoom-in**: `Math.max(mapRef.current.getZoom(), 12)` forces the zoom to at least 12, which zooms in aggressively if the user is viewing at a wider zoom level. The user wants to keep their current zoom level.

2. **Sudden, non-fluid centering**: Leaflet's `setView` with `animate: true` and `duration: 0.4` produces a jarring jump rather than a smooth pan. The `flyTo` method provides a much smoother, eased animation.

## Solution

**File**: `src/components/spots/SpotMap.tsx` (line 144-147)

Replace `setView` with `panTo` for a smooth, fluid pan that preserves the current zoom level:

```typescript
// Before (current)
mapRef.current?.setView(
  [spot.latitude!, spot.longitude!],
  Math.max(mapRef.current.getZoom(), 12),
  { animate: true, duration: 0.4 }
);

// After (fixed)
mapRef.current?.panTo(
  [spot.latitude!, spot.longitude!],
  { animate: true, duration: 0.5, easeLinearity: 0.25 }
);
```

**What changes**:
- `panTo` instead of `setView` -- keeps the current zoom level exactly as-is
- Slightly longer duration (0.5s) with easing for a fluid, natural-feeling center animation
- No more `Math.max(..., 12)` zoom override

This is a single-line change in one file.
