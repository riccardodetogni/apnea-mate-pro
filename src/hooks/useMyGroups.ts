import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyGroup {
  id: string;
  name: string;
  activity_type: string;
  avatar_url: string | null;
}

export const useMyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First get groups where user is a member
      const { data: memberships, error: membershipsError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (membershipsError) throw membershipsError;

      const memberGroupIds = memberships?.map(m => m.group_id) || [];

      // Also get groups created by user
      const { data: createdGroups, error: createdError } = await supabase
        .from("groups")
        .select("id")
        .eq("created_by", user.id);

      if (createdError) throw createdError;

      const createdGroupIds = createdGroups?.map(g => g.id) || [];

      // Combine and dedupe
      const allGroupIds = [...new Set([...memberGroupIds, ...createdGroupIds])];

      if (allGroupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Fetch group details
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, activity_type, avatar_url")
        .in("id", allGroupIds)
        .order("name", { ascending: true });

      if (groupsError) throw groupsError;

      setGroups(groupsData || []);
    } catch (err) {
      console.error("Error fetching my groups:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  return {
    groups,
    loading,
    refetch: fetchMyGroups,
  };
};
