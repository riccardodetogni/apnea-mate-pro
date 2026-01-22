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
}

export const useSpots = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("spots")
        .select("id, name, environment_type, location, latitude, longitude, description")
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setSpots(data || []);
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
