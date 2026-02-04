import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SpotDetails {
  id: string;
  name: string;
  environment_type: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  created_at: string;
}

export interface SpotSession {
  id: string;
  title: string;
  date_time: string;
  session_type: string;
  level: string;
  max_participants: number;
  current_participants: number;
  creator: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export const useSpotDetails = (spotId: string | undefined) => {
  const [spot, setSpot] = useState<SpotDetails | null>(null);
  const [sessions, setSessions] = useState<SpotSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpotDetails = useCallback(async () => {
    if (!spotId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch spot details
      const { data: spotData, error: spotError } = await supabase
        .from("spots")
        .select("*")
        .eq("id", spotId)
        .single();

      if (spotError) throw spotError;
      
      // Convert numeric strings to numbers for coordinates
      setSpot({
        ...spotData,
        latitude: spotData.latitude ? Number(spotData.latitude) : null,
        longitude: spotData.longitude ? Number(spotData.longitude) : null,
      });

      // Fetch upcoming sessions at this spot
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select(`
          id,
          title,
          date_time,
          session_type,
          level,
          max_participants,
          creator_id,
          status
        `)
        .eq("spot_id", spotId)
        .eq("status", "active")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(10);

      if (sessionsError) throw sessionsError;

      // Fetch creator profiles and participant counts
      const sessionsWithDetails = await Promise.all(
        (sessionsData || []).map(async (session) => {
          // Get creator profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id, name, avatar_url")
            .eq("user_id", session.creator_id)
            .single();

          // Get participant count
          const { count } = await supabase
            .from("session_participants")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session.id)
            .in("status", ["pending", "confirmed"]);

          return {
            id: session.id,
            title: session.title,
            date_time: session.date_time,
            session_type: session.session_type,
            level: session.level,
            max_participants: session.max_participants,
            current_participants: count || 0,
            creator: {
              id: profileData?.user_id || session.creator_id,
              name: profileData?.name || "Unknown",
              avatar_url: profileData?.avatar_url || null,
            },
          };
        })
      );

      setSessions(sessionsWithDetails);
    } catch (err) {
      console.error("Error fetching spot details:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => {
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  return {
    spot,
    sessions,
    loading,
    error,
    refetch: fetchSpotDetails,
  };
};
