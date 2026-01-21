import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Session {
  id: string;
  creator_id: string;
  spot_id: string | null;
  title: string;
  description: string | null;
  session_type: string;
  level: string;
  date_time: string;
  duration_minutes: number;
  max_participants: number;
  is_public: boolean;
  status: string;
  created_at: string;
  spot?: {
    id: string;
    name: string;
    environment_type: string;
    location: string;
  } | null;
  creator?: {
    name: string;
    avatar_url: string | null;
  } | null;
  participants_count?: number;
  is_joined?: boolean;
}

export interface SessionWithDetails {
  id: string;
  spotName: string;
  environmentType: string;
  sessionType: string;
  dateTime: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced" | "allLevels";
  spotsAvailable: number;
  spotsTotal: number;
  creatorName: string;
  creatorInitial: string;
  creatorRole: "user" | "instructor" | "instructorF";
  isJoined: boolean;
}

const formatSessionDateTime = (dateTime: string, durationMinutes: number): string => {
  const date = new Date(dateTime);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let dayStr: string;
  if (date.toDateString() === now.toDateString()) {
    dayStr = "Oggi";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dayStr = "Domani";
  } else {
    const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    dayStr = days[date.getDay()];
  }
  
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationStr = durationMins > 0 
    ? `${durationHours}h ${durationMins}` 
    : `${durationHours}h`;
  
  return `${dayStr} · ${hours}:${minutes} · ${durationStr}`;
};

const mapLevelToType = (level: string): "beginner" | "intermediate" | "advanced" | "allLevels" => {
  switch (level) {
    case "beginner": return "beginner";
    case "intermediate": return "intermediate";
    case "advanced": return "advanced";
    default: return "allLevels";
  }
};

const mapSessionType = (type: string): string => {
  switch (type) {
    case "sea_trip": return "Uscita mare";
    case "pool_session": return "Piscina";
    case "deep_pool_session": return "Piscina profonda";
    case "lake_trip": return "Uscita lago";
    case "training": return "Allenamento";
    default: return type;
  }
};

const mapEnvironmentType = (type: string): string => {
  switch (type) {
    case "sea": return "Mare";
    case "lake": return "Lago";
    case "pool": return "Piscina";
    case "deep_pool": return "Deep pool";
    default: return type;
  }
};

export const useSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sessions with spot info
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select(`
          *,
          spot:spots(id, name, environment_type, location)
        `)
        .eq("status", "active")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(20);

      if (sessionsError) throw sessionsError;

      // Get unique creator IDs
      const creatorIds = [...new Set(sessionsData?.map(s => s.creator_id) || [])];
      
      // Fetch creator profiles
      let creatorProfiles: Record<string, { name: string; avatar_url: string | null }> = {};
      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", creatorIds);

        if (profilesData) {
          profilesData.forEach(p => {
            creatorProfiles[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
          });
        }
      }

      // Fetch participant counts for each session
      const sessionIds = sessionsData?.map(s => s.id) || [];
      
      let participantCounts: Record<string, number> = {};
      let userParticipations: Set<string> = new Set();

      if (sessionIds.length > 0) {
        const { data: participantsData } = await supabase
          .from("session_participants")
          .select("session_id, user_id")
          .in("session_id", sessionIds)
          .eq("status", "confirmed");

        if (participantsData) {
          participantsData.forEach(p => {
            participantCounts[p.session_id] = (participantCounts[p.session_id] || 0) + 1;
            if (user && p.user_id === user.id) {
              userParticipations.add(p.session_id);
            }
          });
        }
      }

      const enrichedSessions = sessionsData?.map(session => ({
        ...session,
        creator: creatorProfiles[session.creator_id] || null,
        participants_count: participantCounts[session.id] || 0,
        is_joined: userParticipations.has(session.id),
      })) || [];

      setSessions(enrichedSessions as Session[]);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const joinSession = async (sessionId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("session_participants")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        status: "confirmed",
      });

    if (!error) {
      await fetchSessions();
    }

    return { error };
  };

  const leaveSession = async (sessionId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    if (!error) {
      await fetchSessions();
    }

    return { error };
  };

  // Transform to UI-friendly format
  const formattedSessions: SessionWithDetails[] = sessions.map(session => ({
    id: session.id,
    spotName: session.spot?.name || "Spot sconosciuto",
    environmentType: mapEnvironmentType(session.spot?.environment_type || "sea"),
    sessionType: mapSessionType(session.session_type),
    dateTime: formatSessionDateTime(session.date_time, session.duration_minutes),
    title: session.title,
    level: mapLevelToType(session.level),
    spotsAvailable: session.max_participants - (session.participants_count || 0),
    spotsTotal: session.max_participants,
    creatorName: session.creator?.name || "Utente",
    creatorInitial: (session.creator?.name || "U").charAt(0).toUpperCase(),
    creatorRole: "user" as const, // TODO: Get from user_roles
    isJoined: session.is_joined || false,
  }));

  return {
    sessions: formattedSessions,
    rawSessions: sessions,
    loading,
    error,
    refetch: fetchSessions,
    joinSession,
    leaveSession,
  };
};

export const useSessionsFromFollowing = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowingSessions = async () => {
      if (!user) {
        setSessions([]);
        setLoading(false);
        return;
      }

      try {
        // Get list of users this user follows
        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followingIds = followsData?.map(f => f.following_id) || [];

        if (followingIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        // Fetch sessions from followed users
        const { data: sessionsData } = await supabase
          .from("sessions")
          .select(`
            *,
            spot:spots(id, name, environment_type, location)
          `)
          .in("creator_id", followingIds)
          .eq("status", "active")
          .gte("date_time", new Date().toISOString())
          .order("date_time", { ascending: true })
          .limit(10);

        // Fetch creator profiles
        const creatorIds = [...new Set(sessionsData?.map(s => s.creator_id) || [])];
        let creatorProfiles: Record<string, { name: string; avatar_url: string | null }> = {};
        if (creatorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, name, avatar_url")
            .in("user_id", creatorIds);

          if (profilesData) {
            profilesData.forEach(p => {
              creatorProfiles[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
            });
          }
        }

        const formattedSessions: SessionWithDetails[] = (sessionsData || []).map(session => {
          const creator = creatorProfiles[session.creator_id];
          return {
            id: session.id,
            spotName: session.spot?.name || "Spot sconosciuto",
            environmentType: mapEnvironmentType(session.spot?.environment_type || "sea"),
            sessionType: mapSessionType(session.session_type),
            dateTime: formatSessionDateTime(session.date_time, session.duration_minutes),
            title: session.title,
            level: mapLevelToType(session.level),
            spotsAvailable: session.max_participants,
            spotsTotal: session.max_participants,
            creatorName: creator?.name || "Utente",
            creatorInitial: (creator?.name || "U").charAt(0).toUpperCase(),
            creatorRole: "user" as const,
            isJoined: false,
          };
        });

        setSessions(formattedSessions);
      } catch (err) {
        console.error("Error fetching following sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowingSessions();
  }, [user]);

  return { sessions, loading };
};
