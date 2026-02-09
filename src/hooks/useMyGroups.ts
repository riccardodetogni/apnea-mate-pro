import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyGroup {
  id: string;
  name: string;
  activity_type: string;
  avatar_url: string | null;
}

async function fetchMyGroupsData(userId: string): Promise<MyGroup[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (membershipsError) throw membershipsError;

  const memberGroupIds = memberships?.map(m => m.group_id) || [];

  const { data: createdGroups, error: createdError } = await supabase
    .from("groups")
    .select("id")
    .eq("created_by", userId);

  if (createdError) throw createdError;

  const createdGroupIds = createdGroups?.map(g => g.id) || [];
  const allGroupIds = [...new Set([...memberGroupIds, ...createdGroupIds])];

  if (allGroupIds.length === 0) return [];

  const { data: groupsData, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, activity_type, avatar_url")
    .in("id", allGroupIds)
    .order("name", { ascending: true });

  if (groupsError) throw groupsError;

  return groupsData || [];
}

export const useMyGroups = () => {
  const { user } = useAuth();

  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ["my-groups", user?.id],
    queryFn: () => fetchMyGroupsData(user!.id),
    enabled: !!user,
  });

  return {
    groups,
    loading,
    refetch: () => {},
  };
};
