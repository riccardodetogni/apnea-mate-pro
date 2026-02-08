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

// Custom colored marker using SVG
const createColoredMarker = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? 35 : 25;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size * 1.4}">
      <path fill="${color}" stroke="${isSelected ? '#000' : '#333'}" stroke-width="${isSelected ? 2 : 1}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size * 1.4],
    iconAnchor: [size / 2, size * 1.4],
    popupAnchor: [0, -size * 1.2],
  });
};

interface SpotMapProps {
  spots: Spot[];
  selectedSpotId?: string;
  onSelectSpot: (spotId: string) => void;
  onDeselectSpot?: () => void;
  className?: string;
}

const SpotMap = ({
  spots,
  selectedSpotId,
  onSelectSpot,
  onDeselectSpot,
  className,
}: SpotMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const hasFittedBoundsRef = useRef(false);

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
      zoomControl: false,
    }).setView(defaultCenter, 8);

    // Add zoom control to bottom-right to avoid overlap with search
    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Click on map (not marker) to deselect
    mapRef.current.on("click", () => {
      onDeselectSpot?.();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update deselect handler ref
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.off("click");
    mapRef.current.on("click", () => {
      onDeselectSpot?.();
    });
  }, [onDeselectSpot]);

  // Fit bounds only once when spots first load
  useEffect(() => {
    if (!mapRef.current || hasFittedBoundsRef.current || spotsWithCoords.length === 0) return;
    const bounds = L.latLngBounds(
      spotsWithCoords.map((s) => [s.latitude!, s.longitude!] as L.LatLngTuple)
    );
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    hasFittedBoundsRef.current = true;
  }, [spotsWithCoords]);

  // Update markers when spots or selection change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    spotsWithCoords.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;

      // Determine marker color based on session availability
      let markerColor: string;
      if (spot.hasActiveSessions) {
        markerColor = "hsl(200, 80%, 50%)";
      } else {
        markerColor = "hsl(0, 0%, 60%)";
      }

      const icon = createColoredMarker(markerColor, isSelected);

      const marker = L.marker([spot.latitude!, spot.longitude!], { icon }).addTo(
        mapRef.current!
      );

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectSpot(spot.id);
        mapRef.current?.panTo([spot.latitude!, spot.longitude!], {
          animate: true,
          duration: 0.5,
          easeLinearity: 0.25,
        });
      });

      markersRef.current.push(marker);
    });
  }, [spots, selectedSpotId, onSelectSpot, spotsWithCoords]);

  return (
    <div
      ref={containerRef}
      className={className || "h-[300px] rounded-lg overflow-hidden border"}
    />
  );
};

export default SpotMap;
