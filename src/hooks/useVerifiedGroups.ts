import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VerifiedGroup {
  id: string;
  name: string;
}

async function fetchVerifiedGroups(userId: string): Promise<VerifiedGroup[]> {
  // Get groups where user is owner/admin AND group is verified
  const { data: memberships, error: memErr } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .eq("status", "approved");

  if (memErr) throw memErr;
  const groupIds = memberships?.map((m) => m.group_id) || [];
  if (groupIds.length === 0) return [];

  const { data: groups, error: grpErr } = await supabase
    .from("groups")
    .select("id, name")
    .in("id", groupIds)
    .eq("verified", true)
    .order("name");

  if (grpErr) throw grpErr;
  return groups || [];
}

export const useVerifiedGroups = () => {
  const { user } = useAuth();

  const { data: verifiedGroups = [], isLoading: loading } = useQuery({
    queryKey: ["verified-groups", user?.id],
    queryFn: () => fetchVerifiedGroups(user!.id),
    enabled: !!user,
  });

  return { verifiedGroups, loading, canCreateEventsOrCourses: verifiedGroups.length > 0 };
};
