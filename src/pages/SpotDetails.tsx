import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSpotDetails } from "@/hooks/useSpotDetails";
import { useSpotFavorites } from "@/hooks/useSpotFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { ArrowLeft, Heart, Navigation, MapPin, Waves, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format, isToday, isTomorrow } from "date-fns";
import { it } from "date-fns/locale";

const environmentIcons: Record<string, string> = {
  sea: "🌊",
  lake: "🏞️",
  pool: "🏊",
  deep_pool: "🏊‍♂️",
};

const environmentLabels: Record<string, string> = {
  sea: "sea",
  lake: "lake",
  pool: "pool",
  deep_pool: "deepPool",
};

const SpotDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spot, sessions, loading, error } = useSpotDetails(id);
  const { isFavorite, toggleFavorite } = useSpotFavorites();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize mini map
  useEffect(() => {
    if (!spot?.latitude || !spot?.longitude || !mapRef.current) return;

    // Cleanup previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([spot.latitude, spot.longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    // Custom marker
    const markerColor = spot.environment_type === "sea" || spot.environment_type === "lake" 
      ? "#3b82f6" 
      : spot.environment_type === "deep_pool" 
        ? "#22c55e" 
        : "#f97316";

    const customIcon = L.divIcon({
      className: "custom-spot-marker",
      html: `<div style="
        width: 32px;
        height: 32px;
        background: ${markerColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">${environmentIcons[spot.environment_type] || "📍"}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([spot.latitude, spot.longitude], { icon: customIcon }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [spot]);

  const handleFavoriteToggle = () => {
    if (!user) {
      toast.error("Accedi per salvare i preferiti");
      return;
    }
    if (spot) {
      const wasFavorite = isFavorite(spot.id);
      toggleFavorite(spot.id);
      toast.success(wasFavorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti");
    }
  };

  const handleGetDirections = () => {
    if (spot?.latitude && spot?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
      window.open(url, "_blank");
    }
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Oggi, ${format(date, "HH:mm")}`;
    if (isTomorrow(date)) return `${t("tomorrow")}, ${format(date, "HH:mm")}`;
    return format(date, "EEE d MMM, HH:mm", { locale: it });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !spot) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted">{t("error")}</p>
          <Button variant="outline" onClick={() => navigate("/spots")} className="mt-4">
            {t("back")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const spotIsFavorite = isFavorite(spot.id);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground flex-1 truncate">
          {t("spotDetails")}
        </h1>
      </div>

      {/* Hero section */}
      <div className="bg-card rounded-2xl border p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
            {environmentIcons[spot.environment_type] || "📍"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground mb-1">{spot.name}</h2>
            <div className="flex items-center gap-1.5 text-muted text-sm mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{spot.location}</span>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Waves className="w-3 h-3" />
                {t(environmentLabels[spot.environment_type] as any) || spot.environment_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {spot.description && (
        <div className="bg-card rounded-xl border p-4 mb-4">
          <p className="text-sm text-muted leading-relaxed">{spot.description}</p>
        </div>
      )}

      {/* Mini map */}
      {spot.latitude && spot.longitude && (
        <div className="rounded-2xl overflow-hidden border mb-4">
          <div ref={mapRef} className="h-40 w-full" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={spotIsFavorite ? "default" : "outline"}
          className="flex-1 gap-2"
          onClick={handleFavoriteToggle}
        >
          <Heart className={`w-4 h-4 ${spotIsFavorite ? "fill-current" : ""}`} />
          {spotIsFavorite ? "Preferito" : t("addToFavorites")}
        </Button>
        {spot.latitude && spot.longitude && (
          <Button variant="outline" className="flex-1 gap-2" onClick={handleGetDirections}>
            <Navigation className="w-4 h-4" />
            {t("getDirections")}
          </Button>
        )}
      </div>

      {/* Sessions at this spot */}
      <div className="space-y-3 pb-6">
        <h3 className="text-base font-semibold text-foreground">{t("sessionsAtSpot")}</h3>
        
        {sessions.length === 0 ? (
          <div className="bg-card rounded-xl border p-6 text-center">
            <Calendar className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">{t("noSessionsAtSpot")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/sessions/${session.id}`)}
                className="bg-card rounded-xl border p-4 cursor-pointer hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted mb-1">{formatSessionDate(session.date_time)}</p>
                    <h4 className="font-medium text-foreground mb-1.5 truncate">{session.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="badge-level">{t(session.level as any)}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {session.current_participants}/{session.max_participants}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden">
                      {session.creator.avatar_url ? (
                        <img
                          src={session.creator.avatar_url}
                          alt={session.creator.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        session.creator.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SpotDetails;
