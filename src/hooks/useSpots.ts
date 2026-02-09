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

async function fetchSpotsData(): Promise<Spot[]> {
  const { data: spotsData, error: spotsError } = await supabase
    .from("spots")
    .select("id, name, environment_type, location, latitude, longitude, description")
    .order("name", { ascending: true });

  if (spotsError) throw spotsError;

  const now = new Date().toISOString();
  const { data: sessionsData, error: sessionsError } = await supabase
    .from("sessions")
    .select("spot_id")
    .gte("date_time", now)
    .eq("status", "active")
    .not("spot_id", "is", null);

  if (sessionsError) throw sessionsError;

  const spotsWithSessions = new Set(
    sessionsData?.map((s) => s.spot_id).filter(Boolean) || []
  );

  return (spotsData || []).map((spot) => ({
    ...spot,
    hasActiveSessions: spotsWithSessions.has(spot.id),
  }));
}

export const useSpots = () => {
  const { data: spots = [], isLoading: loading, error } = useQuery({
    queryKey: ["spots"],
    queryFn: fetchSpotsData,
  });

  return {
    spots,
    loading,
    error: error as Error | null,
    refetch: () => {}, // React Query handles refetching automatically
  };
};
