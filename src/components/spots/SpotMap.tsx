import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

// Custom icon for selected marker
const selectedIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "selected-marker",
});

interface SpotMapProps {
  spots: Spot[];
  selectedSpotId?: string;
  onSelectSpot: (spotId: string) => void;
}

// Component to fit bounds when spots change
const FitBounds = ({ spots }: { spots: Spot[] }) => {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    if (hasSetBounds.current) return;
    
    const spotsWithCoords = spots.filter(
      (s) => s.latitude !== null && s.longitude !== null
    );
    
    if (spotsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        spotsWithCoords.map((s) => [s.latitude!, s.longitude!])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      hasSetBounds.current = true;
    }
  }, [spots, map]);

  return null;
};

const SpotMap = ({ spots, selectedSpotId, onSelectSpot }: SpotMapProps) => {
  // Filter spots with valid coordinates
  const spotsWithCoords = spots.filter(
    (s) => s.latitude !== null && s.longitude !== null
  );

  // Default center (Italy)
  const defaultCenter: [number, number] = [44.4056, 8.9463]; // Genova

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={8}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds spots={spotsWithCoords} />
        {spotsWithCoords.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.latitude!, spot.longitude!]}
            icon={spot.id === selectedSpotId ? selectedIcon : new L.Icon.Default()}
            eventHandlers={{
              click: () => onSelectSpot(spot.id),
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{spot.name}</p>
                <p className="text-sm text-muted-foreground">{spot.location}</p>
                <button
                  onClick={() => onSelectSpot(spot.id)}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Seleziona
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default SpotMap;
