import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MapPin, Search, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

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

const environmentTypes = [
  { value: "sea", label: "Mare" },
  { value: "pool", label: "Piscina" },
  { value: "deep_pool", label: "Piscina profonda" },
  { value: "lake", label: "Lago" },
];

interface SpotCreatorProps {
  onSpotCreated: (spotId: string) => void;
  onCancel: () => void;
}

const SpotCreator = ({ onSpotCreated, onCancel }: SpotCreatorProps) => {
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    environment_type: "sea",
  });
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = [44.4056, 8.9463];
    mapRef.current = L.map(containerRef.current).setView(defaultCenter, 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    // Click on map to place marker
    mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCoordinates({ lat, lng });
      reverseGeocode(lat, lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker when coordinates change
  useEffect(() => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    if (coordinates) {
      markerRef.current = L.marker([coordinates.lat, coordinates.lng]).addTo(
        mapRef.current
      );
      mapRef.current.setView([coordinates.lat, coordinates.lng], 14);
    }
  }, [coordinates]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        const parts = data.display_name.split(", ");
        const shortLocation = parts.slice(0, 3).join(", ");
        setForm((prev) => ({ ...prev, location: shortLocation }));
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        setCoordinates({ lat: latNum, lng: lngNum });

        const parts = display_name.split(", ");
        const shortLocation = parts.slice(0, 3).join(", ");
        setForm((prev) => ({ ...prev, location: shortLocation }));

        if (mapRef.current) {
          mapRef.current.setView([latNum, lngNum], 14);
        }
      } else {
        toast({
          title: "Nessun risultato",
          description: "Indirizzo non trovato. Prova con un altro termine.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      toast({
        title: "Errore",
        description: "Impossibile cercare l'indirizzo",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un nome per lo spot",
        variant: "destructive",
      });
      return;
    }

    if (!form.location.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci una località",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("spots")
        .insert({
          name: form.name.trim(),
          location: form.location.trim(),
          environment_type: form.environment_type,
          latitude: coordinates?.lat || null,
          longitude: coordinates?.lng || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast({
        title: "Spot creato!",
        description: "Puoi ora selezionarlo per la tua sessione",
      });
      onSpotCreated(data.id);
    } catch (error: any) {
      console.error("Error creating spot:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare lo spot",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Nuovo spot</span>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="spotName">Nome spot *</Label>
        <Input
          id="spotName"
          placeholder="Es: Punta Crena"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={100}
        />
      </div>

      {/* Environment type */}
      <div className="space-y-2">
        <Label>Tipo ambiente</Label>
        <Select
          value={form.environment_type}
          onValueChange={(v) => setForm({ ...form, environment_type: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {environmentTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Address search */}
      <div className="space-y-2">
        <Label>Cerca indirizzo</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Via Roma, Genova..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddressSearch}
            disabled={searching}
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Cerca"
            )}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="space-y-2">
        <Label>Oppure clicca sulla mappa</Label>
        <div
          ref={containerRef}
          className="h-[200px] rounded-lg overflow-hidden border"
        />
      </div>

      {/* Location result */}
      {form.location && (
        <div className="p-3 rounded-lg bg-muted/50 border flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="h-8 text-sm"
              placeholder="Località"
            />
            {coordinates && (
              <p className="text-xs text-muted-foreground">
                {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Annulla
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Salva spot
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SpotCreator;
