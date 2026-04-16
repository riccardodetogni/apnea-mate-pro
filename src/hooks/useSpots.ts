import { useQuery } from "@tanstack/react-query";
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

export interface SpotSession {
  session_type: string;
  level: string;
  date_time: string;
}

interface SpotsData {
  spots: Spot[];
  spotSessions: Record<string, SpotSession[]>;
}

async function fetchSpotsData(): Promise<SpotsData> {
  const { data: spotsData, error: spotsError } = await supabase
    .from("spots")
    .select("id, name, environment_type, location, latitude, longitude, description")
    .order("name", { ascending: true });

  if (spotsError) throw spotsError;

  const now = new Date().toISOString();
  const { data: sessionsData, error: sessionsError } = await supabase
    .from("sessions")
    .select("spot_id, session_type, level, date_time")
    .gte("date_time", now)
    .eq("status", "active")
    .not("spot_id", "is", null);

  if (sessionsError) throw sessionsError;

  const spotsWithSessions = new Set<string>();
  const spotSessions: Record<string, SpotSession[]> = {};

  (sessionsData || []).forEach((s) => {
    if (!s.spot_id) return;
    spotsWithSessions.add(s.spot_id);
    if (!spotSessions[s.spot_id]) spotSessions[s.spot_id] = [];
    spotSessions[s.spot_id].push({
      session_type: s.session_type,
      level: s.level,
      date_time: s.date_time,
    });
  });

  const spots = (spotsData || []).map((spot) => ({
    ...spot,
    hasActiveSessions: spotsWithSessions.has(spot.id),
  }));

  return { spots, spotSessions };
}

export const useSpots = () => {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["spots"],
    queryFn: fetchSpotsData,
  });

  return {
    spots: data?.spots ?? [],
    spotSessions: data?.spotSessions ?? {},
    loading,
    error: error as Error | null,
  };
};
