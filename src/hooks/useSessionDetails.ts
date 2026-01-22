import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SessionParticipant {
  id: string;
  user_id: string;
  status: "pending" | "confirmed" | "cancelled";
  joined_at: string;
  profile?: {
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface SessionDetails {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  duration_minutes: number;
  level: string;
  session_type: string;
  max_participants: number;
  is_public: boolean;
  status: string;
  creator_id: string;
  created_at: string;
  spot: {
    id: string;
    name: string;
    environment_type: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  creator: {
    name: string;
    avatar_url: string | null;
    user_id: string;
  } | null;
  creatorRole: "user" | "instructor";
  participants: SessionParticipant[];
  confirmedCount: number;
  pendingCount: number;
  isCreator: boolean;
  isParticipant: boolean;
  myParticipation: SessionParticipant | null;
}

export const useSessionDetails = (sessionId: string | undefined) => {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch session with spot
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select(`
          *,
          spot:spots (id, name, environment_type, location, latitude, longitude)
        `)
        .eq("id", sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!sessionData) {
        setSession(null);
        setLoading(false);
        return;
      }

      // Fetch creator profile
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .eq("user_id", sessionData.creator_id)
        .maybeSingle();

      // Fetch creator role
      const { data: creatorRoleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionData.creator_id)
        .in("role", ["instructor", "admin"])
        .maybeSingle();

      // Fetch participants
      const { data: participantsData } = await supabase
        .from("session_participants")
        .select("id, user_id, status, joined_at")
        .eq("session_id", sessionId)
        .in("status", ["pending", "confirmed"])
        .order("joined_at", { ascending: true });

      // Fetch participant profiles
      const participantUserIds = participantsData?.map(p => p.user_id) || [];
      let participantProfiles: Record<string, { name: string; avatar_url: string | null }> = {};

      if (participantUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", participantUserIds);

        if (profilesData) {
          profilesData.forEach(p => {
            participantProfiles[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
          });
        }
      }

      const participants: SessionParticipant[] = (participantsData || []).map(p => ({
        ...p,
        status: p.status as "pending" | "confirmed" | "cancelled",
        profile: participantProfiles[p.user_id] || null,
      }));

      const confirmedCount = participants.filter(p => p.status === "confirmed").length;
      const pendingCount = participants.filter(p => p.status === "pending").length;
      const isCreator = user?.id === sessionData.creator_id;
      const myParticipation = user ? participants.find(p => p.user_id === user.id) || null : null;
      const isParticipant = !!myParticipation;

      setSession({
        ...sessionData,
        spot: sessionData.spot as SessionDetails["spot"],
        creator: creatorProfile ? {
          name: creatorProfile.name,
          avatar_url: creatorProfile.avatar_url,
          user_id: creatorProfile.user_id,
        } : null,
        creatorRole: creatorRoleData ? "instructor" : "user",
        participants,
        confirmedCount,
        pendingCount,
        isCreator,
        isParticipant,
        myParticipation,
      });
    } catch (err) {
      console.error("Error fetching session:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  useEffect(() => {
    fetchSession();

    if (sessionId) {
      channelRef.current = supabase
        .channel(`session-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "session_participants",
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            fetchSession();
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchSession, sessionId]);

  const approveParticipant = async (participantId: string) => {
    const { error } = await supabase
      .from("session_participants")
      .update({ status: "confirmed" })
      .eq("id", participantId);

    return { error };
  };

  const rejectParticipant = async (participantId: string) => {
    const { error } = await supabase
      .from("session_participants")
      .update({ status: "cancelled" })
      .eq("id", participantId);

    return { error };
  };

  const cancelSession = async () => {
    if (!sessionId) return { error: new Error("No session") };

    const { error } = await supabase
      .from("sessions")
      .update({ status: "cancelled" })
      .eq("id", sessionId);

    return { error };
  };

  return {
    session,
    loading,
    error,
    refetch: fetchSession,
    approveParticipant,
    rejectParticipant,
    cancelSession,
  };
};
