import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  activity_type: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  is_public: boolean;
  requires_approval?: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
  tags?: string[];
  is_member?: boolean;
  distance_km?: number | null;
  creator_is_instructor?: boolean;
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
  isPending: boolean;
  requiresApproval: boolean;
  isInstructorLed: boolean;
  isVerified: boolean;
  groupType: string;
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
        .limit(30);

      if (groupsError) throw groupsError;

      const groupIds = groupsData?.map(g => g.id) || [];
      const creatorIds = [...new Set(groupsData?.map(g => g.created_by) || [])];
      
      let memberCounts: Record<string, number> = {};
      let userMemberships: Map<string, string> = new Map(); // group_id -> status
      let groupTags: Record<string, string[]> = {};
      let creatorRoles: Record<string, string> = {};

      if (groupIds.length > 0) {
        // Fetch member counts (only approved members)
        const { data: membersData } = await supabase
          .from("group_members")
          .select("group_id, user_id, status")
          .in("group_id", groupIds);

        if (membersData) {
          membersData.forEach(m => {
            // Only count approved members
            if (m.status === 'approved') {
              memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
            }
            if (user && m.user_id === user.id) {
              userMemberships.set(m.group_id, m.status);
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

      // Fetch creator roles to identify instructor-led groups
      if (creatorIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", creatorIds);

        if (rolesData) {
          rolesData.forEach(r => {
            const current = creatorRoles[r.user_id];
            if (!current || r.role === "instructor" || r.role === "admin") {
              creatorRoles[r.user_id] = r.role;
            }
          });
        }
      }

      const enrichedGroups = groupsData?.map(group => {
        const membershipStatus = userMemberships.get(group.id);
        return {
          ...group,
          member_count: memberCounts[group.id] || 0,
          tags: groupTags[group.id] || [],
          is_member: membershipStatus === 'approved',
          is_pending: membershipStatus === 'pending',
          creator_is_instructor: creatorRoles[group.created_by] === "instructor" || 
                                 creatorRoles[group.created_by] === "admin",
        };
      }) || [];

      setGroups(enrichedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    fetchGroups();

    channelRef.current = supabase
      .channel('group-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchGroups]);

  const joinGroup = async (groupId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    // Check if group requires approval
    const group = groups.find(g => g.id === groupId);
    const status = group?.requires_approval ? 'pending' : 'approved';

    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
        status,
      });

    return { error, isPending: status === 'pending' };
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

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
    distanceKm: group.distance_km ?? undefined,
    isMember: group.is_member || false,
    isPending: (group as any).is_pending || false,
    requiresApproval: group.requires_approval || false,
    isInstructorLed: group.creator_is_instructor || false,
    isVerified: (group as any).verified || false,
    groupType: (group as any).group_type || 'community',
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
