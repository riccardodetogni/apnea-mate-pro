import { useState, useEffect, useCallback, useRef } from "react";
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

export const USERS_PAGE_SIZE = 25;

const roleOrder: AppRole[] = ["admin", "instructor", "certified", "regular"];

export const useAdmin = () => {
  const { isAdmin, loading: profileLoading } = useProfile();

  // Users (paginated + searchable)
  const [allUsers, setAllUsers] = useState<(Profile & { role: AppRole })[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  // Groups (loaded lazily)
  const [allGroups, setAllGroups] = useState<AdminGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const groupsLoadedRef = useRef(false);

  const fetchUsersPage = useCallback(
    async (page: number, search: string) => {
      if (!isAdmin) return;
      setUsersLoading(true);
      try {
        const from = page * USERS_PAGE_SIZE;
        const to = from + USERS_PAGE_SIZE - 1;

        let query = supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        const q = search.trim();
        if (q) {
          const like = `%${q}%`;
          query = query.or(`name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`);
        }

        const { data: profiles, count, error } = await query;
        if (error) {
          console.error("Error fetching users:", error);
          setAllUsers([]);
          setUsersTotal(0);
          return;
        }

        const ids = (profiles || []).map((p) => p.user_id);
        let rolesByUser = new Map<string, AppRole[]>();
        if (ids.length > 0) {
          const { data: rolesRows } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", ids);
          for (const r of rolesRows || []) {
            const arr = rolesByUser.get(r.user_id) || [];
            arr.push(r.role as AppRole);
            rolesByUser.set(r.user_id, arr);
          }
        }

        const usersWithRoles = (profiles || []).map((p) => {
          const roles = rolesByUser.get(p.user_id) || [];
          const highestRole = roleOrder.find((r) => roles.includes(r)) || "regular";
          return { ...(p as Profile), role: highestRole };
        });

        setAllUsers(usersWithRoles);
        setUsersTotal(count || 0);
      } finally {
        setUsersLoading(false);
      }
    },
    [isAdmin],
  );

  const fetchAllGroups = useCallback(async () => {
    if (!isAdmin) return;
    setGroupsLoading(true);
    try {
      const { data: groups, error } = await supabase
        .from("groups")
        .select("id, name, location, group_type, verified, verification_requested, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching groups:", error);
        setAllGroups([]);
        return;
      }

      // Batch: single query for all approved members, count in memory
      const { data: members } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("status", "approved");

      const counts = new Map<string, number>();
      for (const m of members || []) {
        counts.set(m.group_id, (counts.get(m.group_id) || 0) + 1);
      }

      setAllGroups(
        (groups || []).map((g) => ({ ...g, member_count: counts.get(g.id) || 0 })),
      );
      groupsLoadedRef.current = true;
    } finally {
      setGroupsLoading(false);
    }
  }, [isAdmin]);

  const ensureGroupsLoaded = useCallback(() => {
    if (!groupsLoadedRef.current && !groupsLoading) fetchAllGroups();
  }, [fetchAllGroups, groupsLoading]);

  // Initial + when page/search change
  useEffect(() => {
    if (!profileLoading && isAdmin) {
      fetchUsersPage(usersPage, usersSearch);
    }
  }, [isAdmin, profileLoading, usersPage, usersSearch, fetchUsersPage]);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (deleteError) return { error: deleteError };

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (!insertError) await fetchUsersPage(usersPage, usersSearch);
    return { error: insertError };
  };

  const toggleGroupVerification = async (groupId: string, verified: boolean) => {
    const updateData: any = { verified };
    if (verified) updateData.verification_requested = false;

    const { error } = await supabase.from("groups").update(updateData).eq("id", groupId);

    if (!error) {
      const { data: group } = await supabase
        .from("groups")
        .select("created_by, name")
        .eq("id", groupId)
        .maybeSingle();

      if (group?.created_by) {
        await supabase.from("notifications").insert({
          user_id: group.created_by,
          type: "group_request_approved" as const,
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
    loading: profileLoading,
    usersLoading,
    groupsLoading,
    usersTotal,
    usersPage,
    usersSearch,
    setUsersPage,
    setUsersSearch: (v: string) => {
      setUsersPage(0);
      setUsersSearch(v);
    },
    pageSize: USERS_PAGE_SIZE,
    ensureGroupsLoaded,
    updateUserRole,
    toggleGroupVerification,
    refresh: () => {
      fetchUsersPage(usersPage, usersSearch);
      if (groupsLoadedRef.current) fetchAllGroups();
    },
  };
};