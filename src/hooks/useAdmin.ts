import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, Profile, Certification, AppRole } from "./useProfile";

export interface CertificationRequest extends Certification {
  profile: Profile;
}

export interface AdminGroup {
  id: string;
  name: string;
  location: string;
  group_type: string;
  verified: boolean;
  created_at: string;
  member_count: number;
}

export const useAdmin = () => {
  const { isAdmin, loading: profileLoading } = useProfile();
  const [pendingCertifications, setPendingCertifications] = useState<CertificationRequest[]>([]);
  const [allUsers, setAllUsers] = useState<(Profile & { role: AppRole })[]>([]);
  const [allGroups, setAllGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingCertifications = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });

    if (error) {
      console.error("Error fetching certifications:", error);
      return;
    }

    // Fetch profiles for each certification
    const enriched: CertificationRequest[] = [];
    for (const cert of data || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", cert.user_id)
        .single();

      if (profile) {
        enriched.push({ ...cert, profile });
      }
    }

    setPendingCertifications(enriched);
  }, [isAdmin]);

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

    // Get roles for each user
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

    // Fetch groups (all or filtered by scuola_club)
    const { data: groups, error } = await supabase
      .from("groups")
      .select("id, name, location, group_type, verified, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      return;
    }

    // Get member counts for each group
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
      Promise.all([fetchPendingCertifications(), fetchAllUsers(), fetchAllGroups()]).finally(() => {
        setLoading(false);
      });
    } else if (!profileLoading) {
      setLoading(false);
    }
  }, [isAdmin, profileLoading, fetchPendingCertifications, fetchAllUsers, fetchAllGroups]);

  const approveCertification = async (certificationId: string, newRole: "certified" | "instructor") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };

    // Get the certification to find user_id
    const { data: cert, error: certError } = await supabase
      .from("certifications")
      .select("user_id")
      .eq("id", certificationId)
      .single();

    if (certError || !cert) {
      return { error: certError || new Error("Certification not found") };
    }

    // Update certification status
    const { error: updateError } = await supabase
      .from("certifications")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", certificationId);

    if (updateError) return { error: updateError };

    // Add new role to user
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: cert.user_id,
        role: newRole,
      }, {
        onConflict: "user_id,role",
      });

    if (roleError) return { error: roleError };

    // Send email notification for certification approval
    try {
      await supabase.functions.invoke("send-certification-notification", {
        body: {
          type: "approved",
          userId: cert.user_id,
          newRole: newRole,
        },
      });
    } catch (emailError) {
      console.error("Failed to send certification approval email:", emailError);
    }

    // Refresh data
    await fetchPendingCertifications();
    await fetchAllUsers();

    return { error: null };
  };

  const rejectCertification = async (certificationId: string, reason?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };

    // Get the certification to find user_id
    const { data: cert, error: certError } = await supabase
      .from("certifications")
      .select("user_id")
      .eq("id", certificationId)
      .single();

    if (certError || !cert) {
      return { error: certError || new Error("Certification not found") };
    }

    const { error } = await supabase
      .from("certifications")
      .update({
        status: "rejected",
        rejection_reason: reason || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", certificationId);

    if (!error) {
      // Send email notification for certification rejection
      try {
        await supabase.functions.invoke("send-certification-notification", {
          body: {
            type: "rejected",
            userId: cert.user_id,
            reason: reason,
          },
        });
      } catch (emailError) {
        console.error("Failed to send certification rejection email:", emailError);
      }

      await fetchPendingCertifications();
    }

    return { error };
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    // Remove existing roles except the new one
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) return { error: deleteError };

    // Add the new role
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
    const { error } = await supabase
      .from("groups")
      .update({ verified })
      .eq("id", groupId);

    if (!error) {
      await fetchAllGroups();
    }

    return { error };
  };

  return {
    isAdmin,
    pendingCertifications,
    allUsers,
    allGroups,
    loading: loading || profileLoading,
    approveCertification,
    rejectCertification,
    updateUserRole,
    toggleGroupVerification,
    refresh: () => {
      fetchPendingCertifications();
      fetchAllUsers();
      fetchAllGroups();
    },
  };
};
