import { useEffect, useRef } from "react";
import L from "leaflet";
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

interface SpotMiniMapProps {
  latitude: number | null;
  longitude: number | null;
  className?: string;
  onClick?: () => void;
}

export const SpotMiniMap = ({ latitude, longitude, className, onClick }: SpotMiniMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center (Italy - Genova)
    const defaultCenter: L.LatLngExpression = [44.4056, 8.9463];
    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    }).setView(defaultCenter, 8);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center + marker when coords available
  useEffect(() => {
    if (!mapRef.current) return;

    const lat = typeof latitude === "number" ? latitude : NaN;
    const lng = typeof longitude === "number" ? longitude : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const center: L.LatLngExpression = [lat, lng];
    mapRef.current.setView(center, 13, { animate: false });

    if (!markerRef.current) {
      markerRef.current = L.marker(center, { icon: new L.Icon.Default() }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(center);
    }

    // If the map was initialized before layout settled, it can appear blank until invalidateSize.
    requestAnimationFrame(() => mapRef.current?.invalidateSize());
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 150);
    return () => window.clearTimeout(t);
  }, [latitude, longitude]);

  return (
    <div 
      ref={containerRef} 
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    />
  );
};
