import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, Profile, Certification, AppRole } from "./useProfile";

export interface CertificationRequest extends Certification {
  profile: Profile;
}

export const useAdmin = () => {
  const { isAdmin, loading: profileLoading } = useProfile();
  const [pendingCertifications, setPendingCertifications] = useState<CertificationRequest[]>([]);
  const [allUsers, setAllUsers] = useState<(Profile & { role: AppRole })[]>([]);
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

  useEffect(() => {
    if (!profileLoading && isAdmin) {
      setLoading(true);
      Promise.all([fetchPendingCertifications(), fetchAllUsers()]).finally(() => {
        setLoading(false);
      });
    } else if (!profileLoading) {
      setLoading(false);
    }
  }, [isAdmin, profileLoading, fetchPendingCertifications, fetchAllUsers]);

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

    // Refresh data
    await fetchPendingCertifications();
    await fetchAllUsers();

    return { error: null };
  };

  const rejectCertification = async (certificationId: string, reason?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };

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

  return {
    isAdmin,
    pendingCertifications,
    allUsers,
    loading: loading || profileLoading,
    approveCertification,
    rejectCertification,
    updateUserRole,
    refresh: () => {
      fetchPendingCertifications();
      fetchAllUsers();
    },
  };
};
