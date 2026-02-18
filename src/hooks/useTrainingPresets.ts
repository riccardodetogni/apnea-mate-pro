import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrainingMode, TrainingPreset, Co2TableConfig, QuadraticConfig } from "@/types/training";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

export const useTrainingPresets = (mode: TrainingMode) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["training-presets", mode, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("training_presets" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("mode", mode)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TrainingPreset[];
    },
    enabled: !!user,
  });

  const savePreset = useMutation({
    mutationFn: async ({
      name,
      config,
      customRows,
    }: {
      name: string;
      config: Co2TableConfig | QuadraticConfig;
      customRows?: { breathe: number; hold: number }[] | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("training_presets" as any).insert({
        user_id: user.id,
        name,
        mode,
        config: config as any,
        custom_rows: customRows ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-presets", mode] });
      toast.success(t("presetSaved"));
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_presets" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-presets", mode] });
      toast.success(t("presetDeleted"));
    },
  });

  return { presets, isLoading, savePreset, deletePreset };
};
