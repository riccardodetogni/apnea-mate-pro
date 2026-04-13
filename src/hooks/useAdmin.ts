import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, Profile, AppRole } from "./useProfile";
import { t } from "@/lib/i18n";

export interface AdminGroup {
  id: string;
  name: string;
  location: string;
  group_type: string;
  verified: boolean;
  verification_requested: boolean;
  created_at: string;
  member_count: number;
}

export const useAdmin = () => {
  const { isAdmin, loading: profileLoading } = useProfile();
  const [allUsers, setAllUsers] = useState<(Profile & { role: AppRole })[]>([]);
  const [allGroups, setAllGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    const usersWithRoles: (Profile & { role: AppRole })[] = [];
    for (const profile of profiles || []) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id);

      const roleOrder: AppRole[] = ["admin", "instructor", "certified", "regular"];
      const highestRole = roleOrder.find(r => roles?.some(ur => ur.role === r)) || "regular";
      usersWithRoles.push({ ...profile, role: highestRole });
    }

    setAllUsers(usersWithRoles);
  }, [isAdmin]);

  const fetchAllGroups = useCallback(async () => {
    if (!isAdmin) return;

    const { data: groups, error } = await supabase
      .from("groups")
      .select("id, name, location, group_type, verified, verification_requested, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      return;
    }

    const groupsWithCounts: AdminGroup[] = [];
    for (const group of groups || []) {
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .eq("status", "approved");

      groupsWithCounts.push({
        ...group,
        member_count: count || 0,
      });
    }

    setAllGroups(groupsWithCounts);
  }, [isAdmin]);

  useEffect(() => {
    if (!profileLoading && isAdmin) {
      setLoading(true);
      Promise.all([fetchAllUsers(), fetchAllGroups()]).finally(() => {
        setLoading(false);
      });
    } else if (!profileLoading) {
      setLoading(false);
    }
  }, [isAdmin, profileLoading, fetchAllUsers, fetchAllGroups]);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) return { error: deleteError };

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: newRole,
      });

    if (!insertError) {
      await fetchAllUsers();
    }

    return { error: insertError };
  };

  const toggleGroupVerification = async (groupId: string, verified: boolean) => {
    const updateData: any = { verified };
    if (verified) {
      updateData.verification_requested = false;
    }

    const { error } = await supabase
      .from("groups")
      .update(updateData)
      .eq("id", groupId);

    if (!error) {
      // Notify the group owner
      const { data: group } = await supabase
        .from("groups")
        .select("created_by, name")
        .eq("id", groupId)
        .maybeSingle();

      if (group?.created_by) {
        await supabase.from("notifications").insert({
          user_id: group.created_by,
          type: verified ? "group_request_approved" as const : "group_request_approved" as const,
          title: verified ? t("groupVerified") : t("verificationRemoved"),
          message: verified
            ? `${t("groupVerified")}: "${group.name}"`
            : `${t("verificationRemoved")}: "${group.name}"`,
          metadata: { group_id: groupId },
        });
      }

      await fetchAllGroups();
    }

    return { error };
  };

  return {
    isAdmin,
    allUsers,
    allGroups,
    loading: loading || profileLoading,
    updateUserRole,
    toggleGroupVerification,
    refresh: () => {
      fetchAllUsers();
      fetchAllGroups();
    },
  };
};
