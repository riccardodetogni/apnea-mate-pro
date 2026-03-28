import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "regular" | "certified" | "instructor" | "admin";
export type CertificationStatus = "not_submitted" | "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  search_visibility: boolean;
  has_insurance: boolean;
  insurance_provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  user_id: string;
  agency: string;
  level: string;
  certification_id: string | null;
  document_url: string | null;
  status: CertificationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
}

interface ProfileData {
  profile: Profile | null;
  role: AppRole;
  certification: Certification | null;
}

async function fetchProfileData(userId: string): Promise<ProfileData> {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile:", profileError);
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  let role: AppRole = "regular";
  if (roles && roles.length > 0) {
    const roleOrder: AppRole[] = ["admin", "instructor", "certified", "regular"];
    role = roleOrder.find(r => roles.some(ur => ur.role === r)) || "regular";
  }

  const { data: certData, error: certError } = await supabase
    .from("certifications")
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (certError) {
    console.error("Error fetching certification:", certError);
  }

  return { profile: profileData, role, certification: certData };
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfileData(user!.id),
    enabled: !!user,
  });

  const profile = data?.profile ?? null;
  const role = data?.role ?? "regular";
  const certification = data?.certification ?? null;

  const updateProfile = async (updates: Partial<Pick<Profile, "name" | "location" | "avatar_url" | "search_visibility" | "bio" | "has_insurance" | "insurance_provider">>) => {
    if (!user || !profile) return { error: new Error("No user or profile") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (!error) {
      queryClient.setQueryData(["profile", user.id], (old: ProfileData | undefined) =>
        old ? { ...old, profile: { ...old.profile!, ...updates } } : old
      );
    }

    return { error };
  };

  const submitCertification = async (certData: {
    agency: string;
    level: string;
    certification_id?: string;
    document_url?: string;
    isInstructor?: boolean;
  }) => {
    if (!user) return { error: new Error("No user") };

    const { data: newCert, error } = await supabase
      .from("certifications")
      .insert({
        user_id: user.id,
        agency: certData.agency,
        level: certData.level,
        certification_id: certData.certification_id || null,
        document_url: certData.document_url || null,
        status: "approved",
      })
      .select()
      .single();

    if (!error && newCert) {
      // Auto-assign role based on instructor flag
      const assignedRole: AppRole = certData.isInstructor ? "instructor" : "certified";
      await supabase
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: assignedRole,
        }, {
          onConflict: "user_id,role",
        });

      queryClient.setQueryData(["profile", user.id], (old: ProfileData | undefined) =>
        old ? { ...old, certification: newCert, role: old.role === "regular" ? assignedRole : old.role } : old
      );
    }

    return { error, data: newCert };
  };

  const isCertified = role === "certified" || role === "instructor" || role === "admin";
  const isInstructor = role === "instructor" || role === "admin";
  const isAdmin = role === "admin";

  return {
    profile,
    role,
    certification,
    loading,
    isCertified,
    isInstructor,
    isAdmin,
    updateProfile,
    submitCertification,
    refreshProfile: () => queryClient.invalidateQueries({ queryKey: ["profile", user?.id] }),
  };
};
