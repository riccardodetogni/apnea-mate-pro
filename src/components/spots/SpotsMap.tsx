import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { Spot } from "@/hooks/useSpots";
import "leaflet/dist/leaflet.css";

interface SpotsMapProps {
  spots: Spot[];
  selectedSpotId?: string;
  onSelectSpot: (spotId: string) => void;
}

// Custom marker colors based on environment type
const getMarkerColor = (environmentType: string): string => {
  switch (environmentType) {
    case "sea":
    case "lake":
      return "#2563EB"; // Blue
    case "deep_pool":
      return "#22C55E"; // Green
    case "pool":
      return "#F97316"; // Orange
    default:
      return "#6B7280"; // Gray
  }
};

const getMarkerIcon = (environmentType: string): string => {
  switch (environmentType) {
    case "sea":
      return "🌊";
    case "lake":
      return "🏔️";
    case "pool":
      return "🏊";
    case "deep_pool":
      return "🎯";
    default:
      return "📍";
  }
};

const createCustomIcon = (environmentType: string, isSelected: boolean) => {
  const color = getMarkerColor(environmentType);
  const icon = getMarkerIcon(environmentType);
  const size = isSelected ? 48 : 40;
  const iconSize = isSelected ? 20 : 16;
  
  return L.divIcon({
    className: "custom-spot-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${iconSize}px;
        box-shadow: 0 4px 12px ${color}40;
        border: 3px solid white;
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s ease;
      ">
        ${icon}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const SpotsMap = ({ spots, selectedSpotId, onSelectSpot }: SpotsMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Filter spots with valid coordinates
  const spotsWithCoords = spots.filter(
    (s) => s.latitude !== null && s.longitude !== null
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center (Italy - Genova)
    const defaultCenter: L.LatLngExpression = [44.4056, 8.9463];

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false, // Hide zoom controls for cleaner mobile look
    }).setView(defaultCenter, 8);

    // Dark theme tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle spot selection from outside (when user swipes bottom card)
  const panToSpot = useCallback((spotId: string) => {
    const spot = spots.find(s => s.id === spotId);
    if (spot && spot.latitude && spot.longitude && mapRef.current) {
      mapRef.current.panTo([spot.latitude, spot.longitude], { animate: true });
    }
  }, [spots]);

  // Update markers when spots or selection changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    spotsWithCoords.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      const icon = createCustomIcon(spot.environment_type, isSelected);

      const marker = L.marker([spot.latitude!, spot.longitude!], { icon })
        .addTo(mapRef.current!);

      marker.on("click", () => {
        onSelectSpot(spot.id);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if there are spots and no selection
    if (spotsWithCoords.length > 0 && !selectedSpotId && mapRef.current) {
      const bounds = L.latLngBounds(
        spotsWithCoords.map((s) => [s.latitude!, s.longitude!] as L.LatLngTuple)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Pan to selected spot
    if (selectedSpotId) {
      panToSpot(selectedSpotId);
    }
  }, [spots, selectedSpotId, onSelectSpot, spotsWithCoords, panToSpot]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: "linear-gradient(to bottom, #1a1f2e, #0f1419)" }}
    />
  );
};

export default SpotsMap;
