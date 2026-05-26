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
  selected?: SelectedMapItem;
  onSelect: (item: SelectedMapItem) => void;
  onDeselect?: () => void;
  className?: string;
  events?: MapPoint[];
  courses?: MapPoint[];
}

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

export type MapItemType = "spot" | "event" | "course";
export interface SelectedMapItem {
  type: MapItemType;
  id: string;
}

// Spread markers that share the same coordinates onto a small circle so they
// remain individually tappable.
function computeOffsets(
  points: Array<{ key: string; lat: number; lng: number }>,
): Map<string, [number, number]> {
  const groups = new Map<string, Array<{ key: string; lat: number; lng: number }>>();
  for (const p of points) {
    const bucket = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
    const arr = groups.get(bucket);
    if (arr) arr.push(p);
    else groups.set(bucket, [p]);
  }
  const result = new Map<string, [number, number]>();
  const radius = 0.00018; // ~20m
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.set(group[0].key, [group[0].lat, group[0].lng]);
      continue;
    }
    const n = group.length;
    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / n;
      result.set(p.key, [
        p.lat + radius * Math.cos(angle),
        p.lng + radius * Math.sin(angle),
      ]);
    });
  }
  return result;
}

const SpotMap = ({
  spots,
  selected,
  onSelect,
  onDeselect,
  className,
  events = [],
  courses = [],
}: SpotMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const extraMarkersRef = useRef<L.Marker[]>([]);
  const hasFittedBoundsRef = useRef(false);

  // Filter spots with valid coordinates
  const spotsWithCoords = spots.filter(
    (s) => s.latitude !== null && s.longitude !== null
  );

  // Build unified offset map across spots, events, and courses
  const offsets = (() => {
    const all: Array<{ key: string; lat: number; lng: number }> = [];
    spotsWithCoords.forEach((s) =>
      all.push({ key: `spot:${s.id}`, lat: Number(s.latitude), lng: Number(s.longitude) }),
    );
    events.forEach((e) => {
      const lat = Number(e.latitude);
      const lng = Number(e.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng))
        all.push({ key: `event:${e.id}`, lat, lng });
    });
    courses.forEach((c) => {
      const lat = Number(c.latitude);
      const lng = Number(c.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng))
        all.push({ key: `course:${c.id}`, lat, lng });
    });
    return computeOffsets(all);
  })();

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
      onDeselect?.();
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
      onDeselect?.();
    });
  }, [onDeselect]);

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
      const isSelected = selected?.type === "spot" && selected.id === spot.id;

      // Determine marker color based on session availability
      let markerColor: string;
      if (spot.hasActiveSessions) {
        markerColor = "hsl(200, 80%, 50%)";
      } else {
        markerColor = "hsl(0, 0%, 60%)";
      }

      const icon = createColoredMarker(markerColor, isSelected);

      const pos = offsets.get(`spot:${spot.id}`) ?? [spot.latitude!, spot.longitude!];
      const marker = L.marker(pos as L.LatLngTuple, { icon }).addTo(mapRef.current!);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect({ type: "spot", id: spot.id });
        mapRef.current?.panTo(pos as L.LatLngTuple, {
          animate: true,
          duration: 0.5,
          easeLinearity: 0.25,
        });
      });

      markersRef.current.push(marker);
    });
  }, [spots, selected, onSelect, spotsWithCoords, offsets]);

  // Update event/course markers
  useEffect(() => {
    if (!mapRef.current) return;

    extraMarkersRef.current.forEach((m) => m.remove());
    extraMarkersRef.current = [];

    const eventColor = "hsl(270, 70%, 55%)";
    const courseColor = "hsl(30, 90%, 55%)";

    events.forEach((ev) => {
      const lat = Number(ev.latitude);
      const lng = Number(ev.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const isSelected = selected?.type === "event" && selected.id === ev.id;
      const icon = createColoredMarker(eventColor, isSelected);
      const pos = offsets.get(`event:${ev.id}`) ?? [lat, lng];
      const marker = L.marker(pos as L.LatLngTuple, { icon, title: ev.title }).addTo(mapRef.current!);
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect({ type: "event", id: ev.id });
        mapRef.current?.panTo(pos as L.LatLngTuple, {
          animate: true,
          duration: 0.5,
          easeLinearity: 0.25,
        });
      });
      extraMarkersRef.current.push(marker);
    });

    courses.forEach((co) => {
      const lat = Number(co.latitude);
      const lng = Number(co.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const isSelected = selected?.type === "course" && selected.id === co.id;
      const icon = createColoredMarker(courseColor, isSelected);
      const pos = offsets.get(`course:${co.id}`) ?? [lat, lng];
      const marker = L.marker(pos as L.LatLngTuple, { icon, title: co.title }).addTo(mapRef.current!);
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect({ type: "course", id: co.id });
        mapRef.current?.panTo(pos as L.LatLngTuple, {
          animate: true,
          duration: 0.5,
          easeLinearity: 0.25,
        });
      });
      extraMarkersRef.current.push(marker);
    });
  }, [events, courses, onSelect, selected, offsets]);

  return (
    <div
      ref={containerRef}
      className={className || "h-[300px] rounded-lg overflow-hidden border"}
    />
  );
};

export default SpotMap;
