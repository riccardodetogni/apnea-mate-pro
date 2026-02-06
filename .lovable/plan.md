

# Fix: Map Appearance, BottomNav Overlap, and SpotBubble Visibility

## Problems Identified

1. **Map tiles look plain/light** -- Currently using standard OpenStreetMap tiles. Switch to CartoDB Voyager (clean, modern, slightly muted) or CartoDB Dark Matter for a darker, smoother aesthetic.

2. **Map covers the BottomNav** -- Leaflet internally assigns z-indexes up to 1000+ to its tile pane and controls. The BottomNav uses Tailwind's `z-50` (which is just `z-index: 50`), so Leaflet's layers render on top of it. The fix is to either isolate the map's stacking context or raise the BottomNav's z-index above Leaflet's internal values.

3. **SpotBubble hidden behind map** -- The bubble has `z-20` and sits inside the same relative container as the map. Same root cause: Leaflet's internal z-indexes overpower it.

## Solution

### 1. `src/components/spots/SpotMap.tsx` -- Better tile layer
- Replace the OpenStreetMap tile URL with **CartoDB Voyager** (clean, modern, slightly muted colors that look polished):
  `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- This gives a much smoother, more refined map appearance without going fully dark

### 2. `src/pages/Spots.tsx` -- Fix stacking order
- Move the SpotBubble **outside** the map's parent container so it's not competing with Leaflet's internal z-indexes
- Give the SpotBubble a z-index higher than Leaflet (e.g. `z-[1001]`)
- The BottomNav is already outside the map container but its `z-50` is too low; update the bottom-nav z-index

### 3. `src/index.css` -- Raise BottomNav z-index
- Change `.bottom-nav-container` from `z-50` to `z-[1001]` so it always sits above Leaflet's layers

## Technical Details

### SpotMap.tsx -- Tile layer change (line 76):
```typescript
// Before
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '...'
})

// After
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: '... CartoDB ...',
  maxZoom: 19,
})
```

### Spots.tsx -- Move SpotBubble and fix z-indexes:
```tsx
<div className="fixed inset-0 flex flex-col">
  <div className="flex-1 relative">
    <SpotMap ... className="h-full w-full" />

    {/* Floating search -- already z-[1000], keep it */}
    <div className="absolute top-0 ... z-[1000]">...</div>
  </div>

  {/* Move SpotBubble here, OUTSIDE the map container */}
  {currentSpot && (
    <SpotBubble ... />  {/* Update z-index to z-[1001] */}
  )}

  <BottomNav />
</div>
```

### SpotBubble.tsx -- Fix z-index:
- Change from `z-20` to `z-[1001]` to sit above Leaflet layers
- Change positioning from `absolute` to `fixed` (since it's now outside the map container)
- Adjust `bottom` value to account for BottomNav height

### index.css -- BottomNav z-index:
- Change `.bottom-nav-container` from `z-50` to `z-[1002]` so nav is always on top

## Files to Modify

| File | Change |
|------|--------|
| `src/components/spots/SpotMap.tsx` | Switch tile layer to CartoDB Voyager |
| `src/pages/Spots.tsx` | Move SpotBubble outside map container |
| `src/components/spots/SpotBubble.tsx` | Change to `fixed` positioning with `z-[1001]` |
| `src/index.css` | Raise BottomNav z-index to `z-[1002]` |

