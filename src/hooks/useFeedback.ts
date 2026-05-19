import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FeedbackCategory = "bug" | "suggestion" | "other";
export type FeedbackStatus = "new" | "in_review" | "resolved";

export interface Feedback {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackWithProfile extends Feedback {
  profile?: { name: string; avatar_url: string | null; email: string } | null;
}

export const useMyFeedback = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["feedback", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Feedback[];
    },
  });
};

export const useAllFeedback = (enabled: boolean) => {
  return useQuery({
    queryKey: ["feedback", "all"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as unknown as Feedback[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      if (ids.length === 0) return [] as FeedbackWithProfile[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, email")
        .in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const enriched: FeedbackWithProfile[] = rows.map((r) => ({
        ...r,
        profile: map.get(r.user_id) || null,
      }));
      // sort: status=new first, then created desc
      enriched.sort((a, b) => {
        if (a.status === "new" && b.status !== "new") return -1;
        if (a.status !== "new" && b.status === "new") return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return enriched;
    },
  });
};

export const useSubmitFeedback = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category: FeedbackCategory; message: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("feedback" as any).insert({
        user_id: user.id,
        category: input.category,
        message: input.message.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
};

export const useUpdateFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status?: FeedbackStatus; admin_notes?: string | null }) => {
      const patch: any = {};
      if (input.status) patch.status = input.status;
      if (input.admin_notes !== undefined) patch.admin_notes = input.admin_notes;
      const { error } = await supabase.from("feedback" as any).update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });
};

export const useDeleteFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });
};