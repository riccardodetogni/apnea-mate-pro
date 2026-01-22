import { useState, useEffect, useCallback, useRef } from "react";
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
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  creator?: {
    name: string;
    avatar_url: string | null;
    user_id: string;
  } | null;
  creatorRole?: "user" | "instructor" | "instructorF";
  participants_count?: number;
  is_joined?: boolean;
  distance_km?: number | null;
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
  creatorId: string;
  isJoined: boolean;
  isFull: boolean;
  distanceKm: number | null;
  rawLevel: string;
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

interface UseSessionsOptions {
  excludeJoined?: boolean;
  filterByFollowing?: boolean;
}

export const useSessions = (options: UseSessionsOptions = {}) => {
  const { excludeJoined = false, filterByFollowing = false } = options;
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let followingIds: string[] = [];
      if (filterByFollowing && user) {
        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        followingIds = followsData?.map(f => f.following_id) || [];
        
        if (followingIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
      }

      // Build query
      let query = supabase
        .from("sessions")
        .select(`
          *,
          spot:spots(id, name, environment_type, location, latitude, longitude)
        `)
        .eq("status", "active")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(30);

      if (filterByFollowing && followingIds.length > 0) {
        query = query.in("creator_id", followingIds);
      }

      const { data: sessionsData, error: sessionsError } = await query;
      if (sessionsError) throw sessionsError;

      // Get unique creator IDs
      const creatorIds = [...new Set(sessionsData?.map(s => s.creator_id) || [])];
      
      // Fetch creator profiles and roles
      let creatorProfiles: Record<string, { name: string; avatar_url: string | null; user_id: string }> = {};
      let creatorRoles: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", creatorIds);

        if (profilesData) {
          profilesData.forEach(p => {
            creatorProfiles[p.user_id] = { 
              name: p.name, 
              avatar_url: p.avatar_url,
              user_id: p.user_id 
            };
          });
        }

        // Fetch roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", creatorIds);

        if (rolesData) {
          rolesData.forEach(r => {
            // Keep highest role
            const current = creatorRoles[r.user_id];
            if (!current || 
                (r.role === "instructor" && current !== "admin") ||
                (r.role === "admin")) {
              creatorRoles[r.user_id] = r.role;
            }
          });
        }
      }

      // Fetch participant counts and user participations
      const sessionIds = sessionsData?.map(s => s.id) || [];
      let participantCounts: Record<string, number> = {};
      let userParticipations: Set<string> = new Set();

      if (sessionIds.length > 0) {
        // Count both pending and confirmed as they both reserve capacity
        const { data: participantsData } = await supabase
          .from("session_participants")
          .select("session_id, user_id, status")
          .in("session_id", sessionIds)
          .in("status", ["pending", "confirmed"]);

        if (participantsData) {
          participantsData.forEach(p => {
            // Only count confirmed for display, but track user participation for both
            if (p.status === "confirmed") {
              participantCounts[p.session_id] = (participantCounts[p.session_id] || 0) + 1;
            }
            if (user && p.user_id === user.id) {
              userParticipations.add(p.session_id);
            }
          });
        }
      }

      let enrichedSessions = sessionsData?.map(session => {
        const role = creatorRoles[session.creator_id];
        let creatorRole: "user" | "instructor" | "instructorF" = "user";
        if (role === "instructor" || role === "admin") {
          creatorRole = "instructor";
        }

        return {
          ...session,
          creator: creatorProfiles[session.creator_id] || null,
          creatorRole,
          participants_count: participantCounts[session.id] || 0,
          is_joined: userParticipations.has(session.id),
        };
      }) || [];

      // Filter out joined sessions if requested
      if (excludeJoined) {
        enrichedSessions = enrichedSessions.filter(s => !s.is_joined);
      }

      setSessions(enrichedSessions as Session[]);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, excludeJoined, filterByFollowing]);

  // Set up realtime subscription
  useEffect(() => {
    fetchSessions();

    // Subscribe to session_participants changes for realtime updates
    channelRef.current = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
        },
        () => {
          // Refetch sessions when participants change
          fetchSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
        },
        () => {
          // Refetch when sessions change
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchSessions]);

  const joinSession = async (sessionId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("session_participants")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        status: "pending", // Requests start as pending, session creator must approve
      });

    // Don't need to manually refetch - realtime will handle it
    return { error };
  };

  const leaveSession = async (sessionId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

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
    spotsAvailable: Math.max(0, session.max_participants - (session.participants_count || 0)),
    spotsTotal: session.max_participants,
    creatorName: session.creator?.name || "Utente",
    creatorInitial: (session.creator?.name || "U").charAt(0).toUpperCase(),
    creatorRole: session.creatorRole || "user",
    creatorId: session.creator_id,
    isJoined: session.is_joined || false,
    isFull: (session.participants_count || 0) >= session.max_participants,
    distanceKm: session.distance_km || null,
    rawLevel: session.level,
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
  return useSessions({ filterByFollowing: true, excludeJoined: true });
};
