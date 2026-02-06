import { useState, useEffect, useCallback } from "react";
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

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("regular");
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setRole("regular");
      setCertification(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      }
      setProfile(profileData);

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (roleError && roleError.code !== "PGRST116") {
        console.error("Error fetching role:", roleError);
      }
      
      // Get highest role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (roles && roles.length > 0) {
        const roleOrder: AppRole[] = ["admin", "instructor", "certified", "regular"];
        const highestRole = roleOrder.find(r => roles.some(ur => ur.role === r)) || "regular";
        setRole(highestRole);
      } else {
        setRole("regular");
      }

      // Fetch latest certification
      const { data: certData, error: certError } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (certError) {
        console.error("Error fetching certification:", certError);
      }
      setCertification(certData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Pick<Profile, "name" | "location" | "avatar_url" | "search_visibility" | "bio">>) => {
    if (!user || !profile) return { error: new Error("No user or profile") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (!error) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const submitCertification = async (data: {
    agency: string;
    level: string;
    certification_id?: string;
    document_url?: string;
  }) => {
    if (!user) return { error: new Error("No user") };

    const { data: newCert, error } = await supabase
      .from("certifications")
      .insert({
        user_id: user.id,
        agency: data.agency,
        level: data.level,
        certification_id: data.certification_id || null,
        document_url: data.document_url || null,
        status: "pending",
      })
      .select()
      .single();

    if (!error && newCert) {
      setCertification(newCert);
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
    refreshProfile: fetchProfile,
  };
};
