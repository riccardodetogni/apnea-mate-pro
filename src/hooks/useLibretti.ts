import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LibrettoGroup {
  responsible_id: string;
  responsible_name: string;
  brevetto_label: string | null;
  instructor_user_id: string;
  is_school: boolean;
  participant_count: number;
  signed_count: number;
  last_signed_at: string | null;
  is_current_user: boolean;
}

const fullNameFrom = (p?: { name: string | null; last_name: string | null } | null) =>
  p ? [p.name, p.last_name].filter(Boolean).join(" ") || "—" : "—";

export const useLibrettiGroups = (registerId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["libretti_groups", registerId, user?.id],
    enabled: !!registerId && !!user,
    queryFn: async (): Promise<LibrettoGroup[]> => {
      const [{ data: resps, error: rerr }, { data: parts, error: perr }] = await Promise.all([
        supabase
          .from("dive_register_responsibles")
          .select("id, brevetto_label, is_school, instructor_user_id")
          .eq("register_id", registerId!),
        supabase
          .from("dive_register_participants")
          .select("id, assigned_responsible_id, dive_log_id")
          .eq("register_id", registerId!),
      ]);
      if (rerr) throw rerr;
      if (perr) throw perr;

      const responsibles = resps ?? [];
      const participants = parts ?? [];

      const userIds = Array.from(new Set(responsibles.map((r) => r.instructor_user_id)));
      const profileMap = new Map<string, { name: string | null; last_name: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, name, last_name")
          .in("user_id", userIds);
        (profs ?? []).forEach((p) => profileMap.set(p.user_id, { name: p.name, last_name: p.last_name }));
      }

      const logIds = participants.map((p) => p.dive_log_id).filter((x): x is string => !!x);
      const sigsByLog = new Map<string, { verifier_user_id: string; created_at: string }>();
      if (logIds.length > 0) {
        const { data: sigs } = await supabase
          .from("dive_log_signatures")
          .select("dive_log_id, verifier_user_id, created_at")
          .in("dive_log_id", logIds);
        (sigs ?? []).forEach((s) => sigsByLog.set(s.dive_log_id, s));
      }

      return responsibles.map((r) => {
        const groupParts = participants.filter((p) => p.assigned_responsible_id === r.id);
        const groupSigned = groupParts.filter(
          (p) => p.dive_log_id && sigsByLog.has(p.dive_log_id),
        );
        const lastAt =
          groupSigned
            .map((p) => sigsByLog.get(p.dive_log_id!)!.created_at)
            .sort()
            .reverse()[0] ?? null;
        return {
          responsible_id: r.id,
          responsible_name: fullNameFrom(profileMap.get(r.instructor_user_id)),
          brevetto_label: r.brevetto_label,
          instructor_user_id: r.instructor_user_id,
          is_school: r.is_school,
          participant_count: groupParts.length,
          signed_count: groupSigned.length,
          last_signed_at: lastAt,
          is_current_user: r.instructor_user_id === user!.id,
        };
      });
    },
  });
};

export const useUnassignedCount = (registerId?: string) => {
  return useQuery({
    queryKey: ["libretti_unassigned", registerId],
    enabled: !!registerId,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("dive_register_participants")
        .select("id", { count: "exact", head: true })
        .eq("register_id", registerId!)
        .is("assigned_responsible_id", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
};

export interface LibrettoAnteprimaMember {
  participant_id: string;
  dive_log_id: string | null;
  display_name: string;
  brevetto_label: string | null;
  reached_depth_m: number | null;
  discipline: string | null;
  verified: boolean;
}

export interface LibrettoAnteprimaData {
  responsible_id: string;
  responsible_name: string;
  brevetto_label: string | null;
  instructor_user_id: string;
  members: LibrettoAnteprimaMember[];
}

export const useLibrettiAnteprima = (registerId?: string, groupId?: string) => {
  return useQuery({
    queryKey: ["libretti_anteprima", registerId, groupId],
    enabled: !!registerId && !!groupId,
    queryFn: async (): Promise<LibrettoAnteprimaData | null> => {
      const { data: resp, error: rerr } = await supabase
        .from("dive_register_responsibles")
        .select("id, brevetto_label, instructor_user_id")
        .eq("id", groupId!)
        .maybeSingle();
      if (rerr) throw rerr;
      if (!resp) return null;

      const { data: parts, error: perr } = await supabase
        .from("dive_register_participants")
        .select("id, user_id, guest_name, brevetto_label, dive_log_id")
        .eq("register_id", registerId!)
        .eq("assigned_responsible_id", groupId!);
      if (perr) throw perr;

      const userIds = (parts ?? []).map((p) => p.user_id).filter((x): x is string => !!x);
      const allUserIds = Array.from(new Set([resp.instructor_user_id, ...userIds]));
      const logIds = (parts ?? []).map((p) => p.dive_log_id).filter((x): x is string => !!x);

      const [{ data: profiles }, { data: logs }] = await Promise.all([
        allUserIds.length
          ? supabase.from("profiles").select("user_id, name, last_name").in("user_id", allUserIds)
          : Promise.resolve({ data: [] as { user_id: string; name: string | null; last_name: string | null }[] }),
        logIds.length
          ? supabase
              .from("dive_logs")
              .select("id, discipline, reached_depth_m, verification_status")
              .in("id", logIds)
          : Promise.resolve({ data: [] as { id: string; discipline: string | null; reached_depth_m: number | null; verification_status: string }[] }),
      ]);

      const profMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const logMap = new Map((logs ?? []).map((l) => [l.id, l]));

      const members: LibrettoAnteprimaMember[] = (parts ?? []).map((p) => {
        const prof = p.user_id ? profMap.get(p.user_id) : undefined;
        const log = p.dive_log_id ? logMap.get(p.dive_log_id) : undefined;
        const name = p.guest_name
          ? p.guest_name
          : fullNameFrom(prof);
        return {
          participant_id: p.id,
          dive_log_id: p.dive_log_id,
          display_name: name,
          brevetto_label: p.brevetto_label,
          reached_depth_m: log?.reached_depth_m != null ? Number(log.reached_depth_m) : null,
          discipline: log?.discipline ?? null,
          verified: log?.verification_status === "verified",
        };
      });

      return {
        responsible_id: resp.id,
        responsible_name: fullNameFrom(profMap.get(resp.instructor_user_id)),
        brevetto_label: resp.brevetto_label,
        instructor_user_id: resp.instructor_user_id,
        members,
      };
    },
  });
};
