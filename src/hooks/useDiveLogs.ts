import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type OutingType = "guided" | "free";
export type VerificationStatus = "unverified" | "verified" | "self_signed";

export interface DiveLog {
  id: string;
  user_id: string;
  register_id: string | null;
  outing_type: OutingType;
  discipline: string;
  spot_id: string | null;
  spot_label: string | null;
  dive_date: string;
  start_time: string | null;
  end_time: string | null;
  planned_depth_m: number | null;
  reached_depth_m: number | null;
  dives_count: number | null;
  notes: string | null;
  verification_status: VerificationStatus;
  center_label: string | null;
  instructor_label: string | null;
  breathing_apparatus: boolean | null;
  gas_mix: string | null;
  created_at: string;
  updated_at: string;
  spot?: {
    id: string;
    name: string;
    location: string;
    environment_type: string;
  } | null;
}

export const useDiveLogs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dive_logs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DiveLog[]> => {
      const { data, error } = await supabase
        .from("dive_logs")
        .select("*, spot:spots(id, name, location, environment_type)")
        .eq("user_id", user!.id)
        .order("dive_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const logs = (data ?? []) as unknown as DiveLog[];

      // Exclude register-generated guest logs (staff owns the log but the participant row has no user_id).
      const registerLogIds = logs.filter((l) => !!l.register_id).map((l) => l.id);
      if (registerLogIds.length === 0) return logs;
      const { data: parts } = await supabase
        .from("dive_register_participants")
        .select("dive_log_id, user_id")
        .in("dive_log_id", registerLogIds);
      const guestLogIds = new Set(
        (parts ?? []).filter((p) => p.user_id === null && p.dive_log_id).map((p) => p.dive_log_id as string),
      );
      return logs.filter((l) => !guestLogIds.has(l.id));
    },
  });
};

export const useDiveLog = (id: string | undefined) => {
  return useQuery({
    queryKey: ["dive_log", id],
    enabled: !!id,
    queryFn: async (): Promise<DiveLog | null> => {
      const { data, error } = await supabase
        .from("dive_logs")
        .select("*, spot:spots(id, name, location, environment_type)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as DiveLog) ?? null;
    },
  });
};

/**
 * Brevetto (certification) label frozen on the register participant row
 * linked to this dive log. Null when the log has no register row.
 */
export const useDiveLogBrevetto = (logId: string | undefined) => {
  return useQuery({
    queryKey: ["dive_log_brevetto", logId],
    enabled: !!logId,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("dive_register_participants")
        .select("brevetto_label")
        .eq("dive_log_id", logId!)
        .maybeSingle();
      if (error) throw error;
      return data?.brevetto_label ?? null;
    },
  });
};



export interface CreateDiveLogInput {
  outing_type: OutingType;
  discipline: string;
  spot_id: string | null;
  spot_label?: string | null;
  dive_date: string;
  start_time?: string | null;
  end_time?: string | null;
  planned_depth_m?: number | null;
  reached_depth_m?: number | null;
  dives_count?: number | null;
  notes?: string | null;
  center_label?: string | null;
  instructor_label?: string | null;
  breathing_apparatus?: boolean | null;
  gas_mix?: string | null;
}

export const useCreateDiveLog = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDiveLogInput) => {
      if (!user) throw new Error("not_authenticated");
      const { data, error } = await supabase
        .from("dive_logs")
        .insert({
          user_id: user.id,
          verification_status: "unverified",
          ...input,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dive_logs", user?.id] });
    },
  });
};

export interface UpdateDiveLogInput {
  id: string;
  start_time?: string | null;
  end_time?: string | null;
  planned_depth_m?: number | null;
  reached_depth_m?: number | null;
  dives_count?: number | null;
  discipline?: string;
  center_label?: string | null;
  instructor_label?: string | null;
  breathing_apparatus?: boolean | null;
  gas_mix?: string | null;
  notes?: string | null;
}

export const useUpdateDiveLog = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateDiveLogInput) => {
      const { error } = await supabase
        .from("dive_logs")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["dive_log", id] });
      qc.invalidateQueries({ queryKey: ["dive_logs", user?.id] });
    },
  });
};
