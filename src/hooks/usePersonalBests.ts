import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PersonalBests {
  id?: string;
  user_id: string;
  max_depth_cwt: number | null;
  max_static_sta: number | null; // stored in seconds
  max_dynamic_dyn: number | null;
  max_dynamic_dnf: number | null;
  max_fim: number | null;
  show_on_profile: boolean;
}

// Format seconds to "m:ss"
export const formatStaticTime = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Parse "m:ss" or "m" to seconds
export const parseStaticTime = (input: string): number | null => {
  if (!input.trim()) return null;
  const parts = input.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s)) return null;
    return m * 60 + s;
  }
  if (parts.length === 1) {
    const m = parseInt(parts[0], 10);
    if (isNaN(m)) return null;
    return m * 60;
  }
  return null;
};

export const hasAnyPB = (pbs: PersonalBests | null): boolean => {
  if (!pbs) return false;
  return (
    pbs.max_depth_cwt !== null ||
    pbs.max_static_sta !== null ||
    pbs.max_dynamic_dyn !== null ||
    pbs.max_dynamic_dnf !== null ||
    pbs.max_fim !== null
  );
};

export const usePersonalBests = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [personalBests, setPersonalBests] = useState<PersonalBests | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPersonalBests = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("personal_bests")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching personal bests:", error);
      } else {
        setPersonalBests(data);
      }
    } catch (err) {
      console.error("Error fetching personal bests:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchPersonalBests();
  }, [fetchPersonalBests]);

  const upsertPersonalBests = async (
    values: Partial<Omit<PersonalBests, "id" | "user_id">>
  ) => {
    if (!targetUserId) return { error: new Error("No user") };

    try {
      if (personalBests?.id) {
        // Update existing
        const { error } = await (supabase as any)
          .from("personal_bests")
          .update(values)
          .eq("user_id", targetUserId);

        if (error) return { error };
      } else {
        // Insert new
        const { error } = await (supabase as any)
          .from("personal_bests")
          .insert({ user_id: targetUserId, ...values });

        if (error) return { error };
      }

      await fetchPersonalBests();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const toggleVisibility = async (show: boolean) => {
    return upsertPersonalBests({ show_on_profile: show });
  };

  return {
    personalBests,
    loading,
    upsertPersonalBests,
    toggleVisibility,
    refetch: fetchPersonalBests,
  };
};
