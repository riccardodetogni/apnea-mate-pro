import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Spot {
  id: string;
  name: string;
  environment_type: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  hasActiveSessions: boolean;
}

export const useSpots = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all spots
      const { data: spotsData, error: spotsError } = await supabase
        .from("spots")
        .select("id, name, environment_type, location, latitude, longitude, description")
        .order("name", { ascending: true });

      if (spotsError) throw spotsError;

      // Fetch active sessions count per spot (future sessions only)
      const now = new Date().toISOString();
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("spot_id")
        .gte("date_time", now)
        .eq("status", "active")
        .not("spot_id", "is", null);

      if (sessionsError) throw sessionsError;

      // Create a set of spot IDs that have active sessions
      const spotsWithSessions = new Set(
        sessionsData?.map((s) => s.spot_id).filter(Boolean) || []
      );

      // Merge the data
      const enrichedSpots: Spot[] = (spotsData || []).map((spot) => ({
        ...spot,
        hasActiveSessions: spotsWithSessions.has(spot.id),
      }));

      setSpots(enrichedSpots);
    } catch (err) {
      console.error("Error fetching spots:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  return {
    spots,
    loading,
    error,
    refetch: fetchSpots,
  };
};
