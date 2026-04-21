import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfileData {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  search_visibility: boolean;
  has_insurance: boolean;
  insurance_provider: string | null;
  freediving_since: number | null;
}

export interface UserSession {
  id: string;
  title: string;
  date_time: string;
  session_type: string;
  level: string;
  spot: {
    name: string;
    location: string;
  } | null;
}

export interface SharedGroup {
  id: string;
  name: string;
  location: string;
}

export const useUserProfile = (userId: string | undefined) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sharedGroups, setSharedGroups] = useState<SharedGroup[]>([]);
  const [role, setRole] = useState<string>("regular");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, name, avatar_url, location, bio, search_visibility, has_insurance, insurance_provider, freediving_since")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setError("User not found");
        setLoading(false);
        return;
      }

      setProfile(profileData as unknown as UserProfileData);

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roleData && roleData.length > 0) {
        const roleOrder = ["admin", "instructor", "certified", "regular"];
        const highestRole = roleOrder.find(r => roleData.some(ur => ur.role === r)) || "regular";
        setRole(highestRole);
      }

      // Fetch sessions CREATED by this user (public sessions only)
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select(`
          id,
          title,
          date_time,
          session_type,
          level,
          spots:spot_id (name, location)
        `)
        .eq("creator_id", userId)
        .eq("is_public", true)
        .eq("status", "active")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(5);

      if (sessionsData) {
        setSessions(
          sessionsData.map((s: any) => ({
            id: s.id,
            title: s.title,
            date_time: s.date_time,
            session_type: s.session_type,
            level: s.level,
            spot: s.spots,
          }))
        );
      }

      // Fetch shared groups (if current user is logged in)
      if (currentUser && currentUser.id !== userId) {
        // Get groups the target user is in
        const { data: targetGroups } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", userId);

        if (targetGroups && targetGroups.length > 0) {
          const targetGroupIds = targetGroups.map(g => g.group_id);

          // Get groups the current user is in that overlap
          const { data: currentUserGroups } = await supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", currentUser.id)
            .in("group_id", targetGroupIds);

          if (currentUserGroups && currentUserGroups.length > 0) {
            const sharedGroupIds = currentUserGroups.map(g => g.group_id);

            // Fetch group details
            const { data: groupDetails } = await supabase
              .from("groups")
              .select("id, name, location")
              .in("id", sharedGroupIds)
              .limit(3);

            if (groupDetails) {
              setSharedGroups(groupDetails);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isCertified = role === "certified" || role === "instructor" || role === "admin";
  const isInstructor = role === "instructor" || role === "admin";

  return {
    profile,
    sessions,
    sharedGroups,
    role,
    loading,
    error,
    isCertified,
    isInstructor,
    refresh: fetchProfile,
  };
};
