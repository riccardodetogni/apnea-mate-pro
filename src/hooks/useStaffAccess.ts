import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export interface StaffAccess {
  isInstructor: boolean;
  isSchoolOrAsd: boolean;
  isStaff: boolean;
  verifiedGroupIds: string[];
  loading: boolean;
}

export const useStaffAccess = (): StaffAccess => {
  const { user } = useAuth();
  const { isInstructor, isAdmin, loading: profileLoading } = useProfile();

  const { data: verifiedGroupIds = [], isLoading } = useQuery({
    queryKey: ["staff-verified-groups", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data: mems, error } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user!.id)
        .in("role", ["owner", "admin"])
        .eq("status", "approved");
      if (error) throw error;
      const ids = (mems ?? []).map((m) => m.group_id);
      if (ids.length === 0) return [];
      const { data: groups, error: gerr } = await supabase
        .from("groups")
        .select("id, verified")
        .in("id", ids)
        .eq("verified", true);
      if (gerr) throw gerr;
      return (groups ?? []).map((g) => g.id);
    },
  });

  const isSchoolOrAsd = verifiedGroupIds.length > 0;
  const isStaff = isInstructor || isSchoolOrAsd || isAdmin;

  return {
    isInstructor: isInstructor || isAdmin,
    isSchoolOrAsd,
    isStaff,
    verifiedGroupIds,
    loading: profileLoading || isLoading,
  };
};
