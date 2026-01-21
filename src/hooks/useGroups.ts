import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  activity_type: string;
  location: string;
  avatar_url: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
  tags?: string[];
  is_member?: boolean;
}

export interface GroupWithDetails {
  id: string;
  name: string;
  initial: string;
  memberCount: number;
  activityType: string;
  tags: string[];
  distanceKm?: number;
  isMember: boolean;
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (groupsError) throw groupsError;

      const groupIds = groupsData?.map(g => g.id) || [];
      
      let memberCounts: Record<string, number> = {};
      let userMemberships: Set<string> = new Set();
      let groupTags: Record<string, string[]> = {};

      if (groupIds.length > 0) {
        // Fetch member counts
        const { data: membersData } = await supabase
          .from("group_members")
          .select("group_id, user_id")
          .in("group_id", groupIds);

        if (membersData) {
          membersData.forEach(m => {
            memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
            if (user && m.user_id === user.id) {
              userMemberships.add(m.group_id);
            }
          });
        }

        // Fetch tags
        const { data: tagsData } = await supabase
          .from("group_tags")
          .select("group_id, tag")
          .in("group_id", groupIds);

        if (tagsData) {
          tagsData.forEach(t => {
            if (!groupTags[t.group_id]) {
              groupTags[t.group_id] = [];
            }
            groupTags[t.group_id].push(t.tag);
          });
        }
      }

      const enrichedGroups = groupsData?.map(group => ({
        ...group,
        member_count: memberCounts[group.id] || 0,
        tags: groupTags[group.id] || [],
        is_member: userMemberships.has(group.id),
      })) || [];

      setGroups(enrichedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const joinGroup = async (groupId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      });

    if (!error) {
      await fetchGroups();
    }

    return { error };
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (!error) {
      await fetchGroups();
    }

    return { error };
  };

  // Transform to UI-friendly format
  const formattedGroups: GroupWithDetails[] = groups.map(group => ({
    id: group.id,
    name: group.name,
    initial: group.name.charAt(0).toUpperCase(),
    memberCount: group.member_count || 0,
    activityType: group.activity_type,
    tags: group.tags || [],
    isMember: group.is_member || false,
  }));

  return {
    groups: formattedGroups,
    rawGroups: groups,
    loading,
    error,
    refetch: fetchGroups,
    joinGroup,
    leaveGroup,
  };
};
