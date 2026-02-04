import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyParticipation {
  id: string;
  session_id: string;
  status: "pending" | "confirmed" | "cancelled";
  joined_at: string;
  session: {
    id: string;
    title: string;
    date_time: string;
    duration_minutes: number;
    level: string;
    session_type: string;
    max_participants: number;
    creator_id: string;
    spot?: {
      name: string;
      environment_type: string;
    } | null;
    creator?: {
      name: string;
    } | null;
  };
  confirmed_count?: number;
}

export interface MyCreatedSession {
  id: string;
  title: string;
  date_time: string;
  duration_minutes: number;
  level: string;
  session_type: string;
  max_participants: number;
  spot?: {
    name: string;
    environment_type: string;
  } | null;
  pending_count: number;
  confirmed_count: number;
}

export const useMyParticipations = () => {
  const { user } = useAuth();
  const [participations, setParticipations] = useState<MyParticipation[]>([]);
  const [createdSessions, setCreatedSessions] = useState<MyCreatedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchParticipations = useCallback(async () => {
    if (!user) {
      setParticipations([]);
      setCreatedSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch participations
      const { data, error: fetchError } = await supabase
        .from("session_participants")
        .select(`
          id,
          session_id,
          status,
          joined_at,
          session:sessions (
            id,
            title,
            date_time,
            duration_minutes,
            level,
            session_type,
            max_participants,
            creator_id,
            spot:spots (name, environment_type)
          )
        `)
        .eq("user_id", user.id)
        .in("status", ["pending", "confirmed"])
        .order("joined_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch sessions created by user (future sessions only)
      const { data: createdData, error: createdError } = await supabase
        .from("sessions")
        .select(`
          id,
          title,
          date_time,
          duration_minutes,
          level,
          session_type,
          max_participants,
          spot:spots (name, environment_type)
        `)
        .eq("creator_id", user.id)
        .eq("status", "active")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true });

      if (createdError) throw createdError;

      // Get all session IDs (participations + created)
      const participationSessionIds = data?.map(p => p.session_id) || [];
      const createdSessionIds = createdData?.map(s => s.id) || [];
      const allSessionIds = [...new Set([...participationSessionIds, ...createdSessionIds])];

      let confirmedCounts: Record<string, number> = {};
      let pendingCounts: Record<string, number> = {};

      if (allSessionIds.length > 0) {
        const { data: countData } = await supabase
          .from("session_participants")
          .select("session_id, status")
          .in("session_id", allSessionIds)
          .in("status", ["pending", "confirmed"]);

        if (countData) {
          countData.forEach(c => {
            if (c.status === "confirmed") {
              confirmedCounts[c.session_id] = (confirmedCounts[c.session_id] || 0) + 1;
            } else if (c.status === "pending") {
              pendingCounts[c.session_id] = (pendingCounts[c.session_id] || 0) + 1;
            }
          });
        }
      }

      // Get creator profiles for participations
      const creatorIds = [...new Set(data?.map(p => (p.session as any)?.creator_id).filter(Boolean) || [])];
      let creatorProfiles: Record<string, { name: string }> = {};

      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", creatorIds);

        if (profilesData) {
          profilesData.forEach(p => {
            creatorProfiles[p.user_id] = { name: p.name };
          });
        }
      }

      const enrichedParticipations = (data || []).map(p => {
        const session = p.session as any;
        return {
          ...p,
          session: {
            ...session,
            creator: creatorProfiles[session?.creator_id] || null,
          },
          confirmed_count: confirmedCounts[p.session_id] || 0,
        };
      }) as MyParticipation[];

      const enrichedCreated: MyCreatedSession[] = (createdData || []).map(s => ({
        id: s.id,
        title: s.title,
        date_time: s.date_time,
        duration_minutes: s.duration_minutes,
        level: s.level,
        session_type: s.session_type,
        max_participants: s.max_participants,
        spot: s.spot as any,
        pending_count: pendingCounts[s.id] || 0,
        confirmed_count: confirmedCounts[s.id] || 0,
      }));

      setParticipations(enrichedParticipations);
      setCreatedSessions(enrichedCreated);
    } catch (err) {
      console.error("Error fetching participations:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchParticipations();

    if (user) {
      channelRef.current = supabase
        .channel("my-participations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "session_participants",
          },
          () => {
            fetchParticipations();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sessions",
            filter: `creator_id=eq.${user.id}`,
          },
          () => {
            fetchParticipations();
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchParticipations, user]);

  const cancelParticipation = async (participationId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("id", participationId)
      .eq("user_id", user.id);

    return { error };
  };

  const pendingParticipations = participations.filter(p => p.status === "pending");
  const confirmedParticipations = participations.filter(p => p.status === "confirmed");

  // Separate created sessions by pending requests
  const createdWithPendingRequests = createdSessions.filter(s => s.pending_count > 0);
  const createdWithoutPendingRequests = createdSessions.filter(s => s.pending_count === 0);

  return {
    participations,
    pendingParticipations,
    confirmedParticipations,
    createdSessions,
    createdWithPendingRequests,
    createdWithoutPendingRequests,
    loading,
    error,
    refetch: fetchParticipations,
    cancelParticipation,
  };
};
