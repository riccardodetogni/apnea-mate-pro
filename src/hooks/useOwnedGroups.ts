import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OwnedGroup {
  id: string;
  name: string;
  verified: boolean;
}

async function fetchOwnedGroups(userId: string): Promise<OwnedGroup[]> {
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
    .select("id, name, verified")
    .in("id", groupIds)
    .order("name");

  if (grpErr) throw grpErr;
  return groups || [];
}

export const useOwnedGroups = () => {
  const { user } = useAuth();
  const { data: ownedGroups = [], isLoading: loading } = useQuery({
    queryKey: ["owned-groups", user?.id],
    queryFn: () => fetchOwnedGroups(user!.id),
    enabled: !!user,
  });
  return { ownedGroups, loading };
};