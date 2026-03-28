

# Add Location Autocomplete to Onboarding

## Summary

Replace the plain text input for "Città o regione" in Onboarding Step 1 with an autocomplete that queries the Nominatim API as the user types, showing a dropdown of matching city/region suggestions.

## Approach

Create a reusable `LocationAutocomplete` component that:
- Debounces user input (300ms)
- Queries `https://nominatim.openstreetmap.org/search?format=json&q={query}&accept-language=it&addressdetails=1&limit=5`
- Shows a dropdown list of results (city + region format)
- On selection, sets the location string
- Dismisses on blur or selection

## Files

### New: `src/components/ui/LocationAutocomplete.tsx`
- Input with MapPin icon (same styling as current)
- Dropdown list below input with suggestions
- Debounced Nominatim search (min 3 characters)
- Loading spinner in input while fetching
- Formats results as "City, Region" from Nominatim address details

### Modified: `src/pages/Onboarding.tsx`
- Replace the plain `<Input>` for location (lines 341-349) with `<LocationAutocomplete value={location} onChange={setLocation} />`
- Keep the GPS button alongside it

## Technical Details
- Uses `useState` + `useEffect` with a debounce timer for the search
- Nominatim is already used in the project (reverse geocode in same file), so no new dependency
- Dropdown positioned absolutely below input, styled with `bg-card border rounded-xl shadow-lg`
- Click outside or selection closes dropdown

