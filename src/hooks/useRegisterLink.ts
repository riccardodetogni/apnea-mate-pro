import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterStatus } from "@/hooks/useDiveRegisters";

export interface RegisterLink {
  id: string;
  status: RegisterStatus;
  register_date: string;
  start_time: string | null;
  participant_count: number;
  signed_count: number;
}

const loadLink = async (
  column: "session_id" | "event_id",
  value: string,
): Promise<RegisterLink | null> => {
  const { data: reg, error } = await supabase
    .from("dive_registers")
    .select("id, status, register_date, start_time")
    .eq(column, value)
    .maybeSingle();
  // RLS hides registers from non-managers: treat as "no register" instead of an error.
  if (error || !reg) return null;

  const { data: parts } = await supabase
    .from("dive_register_participants")
    .select("dive_log_id")
    .eq("register_id", reg.id);

  const logIds = (parts ?? []).map((p) => p.dive_log_id).filter((x): x is string => !!x);
  let signed = 0;
  if (logIds.length > 0) {
    const { count } = await supabase
      .from("dive_log_signatures")
      .select("dive_log_id", { count: "exact", head: true })
      .in("dive_log_id", logIds);
    signed = count ?? 0;
  }

  return {
    id: reg.id,
    status: reg.status as RegisterStatus,
    register_date: reg.register_date,
    start_time: reg.start_time,
    participant_count: (parts ?? []).length,
    signed_count: signed,
  };
};

/** Register linked to a session, if any and if the current user may see it. */
export const useRegisterForSession = (sessionId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["register_for_session", sessionId, user?.id],
    enabled: !!sessionId && !!user,
    queryFn: () => loadLink("session_id", sessionId!),
  });
};

/** Register linked to an event, if any and if the current user may see it. */
export const useRegisterForEvent = (eventId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["register_for_event", eventId, user?.id],
    enabled: !!eventId && !!user,
    queryFn: () => loadLink("event_id", eventId!),
  });
};

/** Whether the current user manages (creator/responsible) the register a dive log came from. */
export const useIsRegisterManager = (registerId: string | null | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is_register_manager", registerId, user?.id],
    enabled: !!registerId && !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_dive_register_manager", {
        _uid: user!.id,
        _register_id: registerId!,
      });
      if (error) return false;
      return !!data;
    },
  });
};

/** Origin session/event of a dive log — lets a participant jump back to the outing. */
export const useDiveLogOrigin = (logId: string | undefined, hasRegister: boolean) => {
  return useQuery({
    queryKey: ["dive_log_origin", logId],
    enabled: !!logId && hasRegister,
    queryFn: async (): Promise<
      { kind: "session" | "event"; id: string; title: string } | null
    > => {
      const { data, error } = await supabase.rpc("dive_log_origin", { _log_id: logId! });
      if (error) return null;
      const row = (data ?? [])[0] as { kind: string; ref_id: string; title: string } | undefined;
      if (!row) return null;
      return { kind: row.kind as "session" | "event", id: row.ref_id, title: row.title };
    },
  });
};

