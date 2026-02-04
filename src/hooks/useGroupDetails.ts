import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile: {
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface GroupSession {
  id: string;
  title: string;
  date_time: string;
  session_type: string;
  level: string;
  max_participants: number;
  participant_count: number;
  spot_name?: string;
}

export interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  activity_type: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  is_public: boolean;
  requires_approval: boolean;
  group_type: string;
  verified: boolean;
  created_by: string;
  created_at: string;
  tags: string[];
  member_count: number;
  pending_count: number;
  is_member: boolean;
  is_pending: boolean;
  is_owner: boolean;
  creator_is_instructor: boolean;
}

export const useGroupDetails = (groupId: string | undefined) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      // Fetch tags
      const { data: tagsData } = await supabase
        .from("group_tags")
        .select("tag")
        .eq("group_id", groupId);

      // Fetch members with profiles
      const { data: membersData } = await supabase
        .from("group_members")
        .select("id, user_id, role, status, joined_at")
        .eq("group_id", groupId);

      let memberProfiles: GroupMember[] = [];
      let approvedCount = 0;
      let pendingCount = 0;
      
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        
        memberProfiles = membersData.map(m => {
          if (m.status === 'approved') approvedCount++;
          if (m.status === 'pending') pendingCount++;
          return {
            ...m,
            profile: profileMap.get(m.user_id) || null,
          };
        });
      }

      // Fetch upcoming sessions linked to this group
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select(`
          id, title, date_time, session_type, level, max_participants,
          spots (name)
        `)
        .eq("group_id", groupId)
        .eq("status", "active")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(5);

      // Get participant counts for sessions
      let sessionsWithCounts: GroupSession[] = [];
      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map(s => s.id);
        const { data: participantsData } = await supabase
          .from("session_participants")
          .select("session_id")
          .in("session_id", sessionIds)
          .in("status", ["pending", "confirmed"]);

        const countMap = new Map<string, number>();
        participantsData?.forEach(p => {
          countMap.set(p.session_id, (countMap.get(p.session_id) || 0) + 1);
        });

        sessionsWithCounts = sessionsData.map(s => ({
          id: s.id,
          title: s.title,
          date_time: s.date_time,
          session_type: s.session_type,
          level: s.level,
          max_participants: s.max_participants,
          participant_count: countMap.get(s.id) || 0,
          spot_name: (s.spots as any)?.name,
        }));
      }

      // Check if creator is instructor
      const { data: creatorRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", groupData.created_by)
        .in("role", ["instructor", "admin"])
        .limit(1);

      const userMembership = membersData?.find(m => m.user_id === user?.id);
      const isUserMember = userMembership?.status === 'approved';
      const isUserPending = userMembership?.status === 'pending';
      const isUserOwner = userMembership?.role === 'owner' || 
                          userMembership?.role === 'admin' || 
                          groupData.created_by === user?.id;

      setGroup({
        ...groupData,
        tags: tagsData?.map(t => t.tag) || [],
        member_count: approvedCount,
        pending_count: pendingCount,
        is_member: isUserMember,
        is_pending: isUserPending,
        is_owner: isUserOwner,
        creator_is_instructor: (creatorRole && creatorRole.length > 0) || false,
      });

      setMembers(memberProfiles);
      setSessions(sessionsWithCounts);
    } catch (err) {
      console.error("Error fetching group details:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  const joinGroup = async () => {
    if (!user || !groupId) return { error: new Error("Not authenticated"), isPending: false };

    // Determine status based on requires_approval
    const status = group?.requires_approval ? 'pending' : 'approved';

    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
        status,
      });

    if (!error) {
      await fetchGroupDetails();
    }

    return { error, isPending: status === 'pending' };
  };

  const leaveGroup = async () => {
    if (!user || !groupId) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (!error) {
      await fetchGroupDetails();
    }

    return { error };
  };

  // Approve a pending member
  const approveMember = async (userId: string) => {
    if (!user || !groupId) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .update({ status: 'approved' })
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (!error) {
      await fetchGroupDetails();
    }

    return { error };
  };

  // Reject a pending member
  const rejectMember = async (userId: string) => {
    if (!user || !groupId) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (!error) {
      await fetchGroupDetails();
    }

    return { error };
  };

  // Promote member to owner
  const promoteMember = async (userId: string, newRole: 'owner' | 'admin' | 'member') => {
    if (!user || !groupId) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .update({ role: newRole })
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (!error) {
      await fetchGroupDetails();
    }

    return { error };
  };

  // Remove a member
  const removeMember = async (userId: string) => {
    if (!user || !groupId) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (!error) {
      await fetchGroupDetails();
    }

    return { error };
  };

  // Update group details
  const updateGroup = async (updates: Partial<Pick<GroupDetails, "name" | "description" | "avatar_url">>) => {
    if (!user || !groupId) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId);

    if (!error) {
      setGroup(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  return {
    group,
    members,
    sessions,
    loading,
    error,
    refetch: fetchGroupDetails,
    joinGroup,
    leaveGroup,
    approveMember,
    rejectMember,
    promoteMember,
    removeMember,
    updateGroup,
  };
};
