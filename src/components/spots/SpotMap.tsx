import { useEffect, useRef } from "react";
import L from "leaflet";
import { Spot } from "@/hooks/useSpots";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface SpotMapProps {
  spots: Spot[];
  selectedSpotId?: string;
  onSelectSpot: (spotId: string) => void;
}

const SpotMap = ({ spots, selectedSpotId, onSelectSpot }: SpotMapProps) => {
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

    mapRef.current = L.map(containerRef.current).setView(defaultCenter, 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when spots change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    spotsWithCoords.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      
      const icon = isSelected
        ? L.icon({
            iconUrl: markerIcon,
            iconRetinaUrl: markerIcon2x,
            shadowUrl: markerShadow,
            iconSize: [30, 49],
            iconAnchor: [15, 49],
            popupAnchor: [1, -40],
            shadowSize: [49, 49],
            className: "selected-marker",
          })
        : new L.Icon.Default();

      const marker = L.marker([spot.latitude!, spot.longitude!], { icon })
        .addTo(mapRef.current!)
        .bindPopup(
          `<div class="text-center">
            <p class="font-semibold">${spot.name}</p>
            <p class="text-sm" style="color: #666;">${spot.location}</p>
          </div>`
        );

      marker.on("click", () => {
        onSelectSpot(spot.id);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if there are spots
    if (spotsWithCoords.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        spotsWithCoords.map((s) => [s.latitude!, s.longitude!] as L.LatLngTuple)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [spots, selectedSpotId, onSelectSpot, spotsWithCoords]);

  return (
    <div
      ref={containerRef}
      className="h-[300px] rounded-lg overflow-hidden border"
    />
  );
};

export default SpotMap;
