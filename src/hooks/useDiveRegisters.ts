import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { t, getLocale } from "@/lib/i18n";
import { fullName } from "@/lib/format";


export type RegisterStatus = "da_aprire" | "aperto" | "chiuso";

export interface DiveRegisterSummary {
  id: string;
  title: string;
  spot_label: string | null;
  register_date: string;
  status: RegisterStatus;
  start_time: string | null;
  end_time: string | null;
  max_depth_m: number | null;
  planned_depth_m: number | null;
  center_label: string | null;
  opened_at: string | null;
  closed_at: string | null;
  retention_until: string | null;
  org_group_id: string | null;
  created_by: string;
  session_id: string | null;
  event_id: string | null;

  participant_count: number;
  responsible_count: number;
}

export interface RegisterResponsible {
  id: string;
  register_id: string;
  instructor_user_id: string;
  brevetto_label: string | null;
  is_school: boolean;
  name: string;
}

export type AttendanceStatus = "present" | "absent" | "not_participating";

export interface RegisterParticipant {
  id: string;
  register_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_birthplace: string | null;
  guest_birthdate: string | null;
  brevetto_label: string | null;
  assigned_responsible_id: string | null;
  dive_log_id: string | null;
  attendance_status: AttendanceStatus;
  display_name: string;
  born_line: string;
  is_guest: boolean;
  signed: boolean;
  signed_at: string | null;
}

export interface DiveRegisterDetail extends DiveRegisterSummary {
  responsibles: RegisterResponsible[];
  participants: RegisterParticipant[];
}

const formatBornLine = (place?: string | null, dob?: string | null) => {
  if (!place && !dob) return "";
  const dt = dob ? new Date(dob).toLocaleDateString(getLocale()) : "";
  return `${t("rdBornPrefix")}: ${place ?? "—"}${dt ? ` · ${dt}` : ""}`;
};

export const useDiveRegisters = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dive_registers", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DiveRegisterSummary[]> => {
      const { data: regs, error } = await supabase
        .from("dive_registers")
        .select("*")
        .order("register_date", { ascending: false });
      if (error) throw error;
      const ids = (regs ?? []).map((r) => r.id);
      if (ids.length === 0) return [];

      const [{ data: parts }, { data: resps }] = await Promise.all([
        supabase.from("dive_register_participants").select("register_id").in("register_id", ids),
        supabase.from("dive_register_responsibles").select("register_id").in("register_id", ids),
      ]);

      const pCount = new Map<string, number>();
      (parts ?? []).forEach((p) => pCount.set(p.register_id, (pCount.get(p.register_id) ?? 0) + 1));
      const rCount = new Map<string, number>();
      (resps ?? []).forEach((r) => rCount.set(r.register_id, (rCount.get(r.register_id) ?? 0) + 1));

      return (regs ?? []).map((r) => ({
        ...(r as unknown as DiveRegisterSummary),
        participant_count: pCount.get(r.id) ?? 0,
        responsible_count: rCount.get(r.id) ?? 0,
      }));
    },
  });
};

export const useDiveRegisterDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ["dive_register", id],
    enabled: !!id,
    queryFn: async (): Promise<DiveRegisterDetail | null> => {
      const { data: reg, error } = await supabase
        .from("dive_registers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!reg) return null;

      const [{ data: resps, error: rerr }, { data: parts, error: perr }] = await Promise.all([
        supabase
          .from("dive_register_responsibles")
          .select("*")
          .eq("register_id", id!)
          .order("created_at", { ascending: true }),
        supabase
          .from("dive_register_participants")
          .select("*")
          .eq("register_id", id!)
          .order("created_at", { ascending: true }),
      ]);
      if (rerr) throw rerr;
      if (perr) throw perr;

      const respUserIds = (resps ?? []).map((r) => r.instructor_user_id);
      const partUserIds = (parts ?? []).map((p) => p.user_id).filter((x): x is string => !!x);
      const allUserIds = Array.from(new Set([...respUserIds, ...partUserIds]));
      let profileMap = new Map<string, { name: string; last_name: string | null }>();
      if (allUserIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, name, last_name")
          .in("user_id", allUserIds);
        profileMap = new Map((profs ?? []).map((p) => [p.user_id, { name: p.name, last_name: p.last_name }]));
      }

      const responsibles: RegisterResponsible[] = (resps ?? []).map((r) => {
        const p = profileMap.get(r.instructor_user_id);
        const name = fullName(p, "—");
        return { ...(r as any), name };
      });


      const logIds = (parts ?? []).map((p) => p.dive_log_id).filter((x): x is string => !!x);
      const sigMap = new Map<string, string>();
      if (logIds.length > 0) {
        const { data: sigs } = await supabase
          .from("dive_log_signatures")
          .select("dive_log_id, created_at")
          .in("dive_log_id", logIds);
        (sigs ?? []).forEach((s) => sigMap.set(s.dive_log_id, s.created_at));
      }

      const participants: RegisterParticipant[] = (parts ?? []).map((p: any) => {
        const isGuest = !p.user_id;
        const prof = p.user_id ? profileMap.get(p.user_id) : null;
        const display_name = isGuest
          ? (p.guest_name ?? t("rdGuest"))
          : fullName(prof, "—");

        const signed_at = p.dive_log_id ? sigMap.get(p.dive_log_id) ?? null : null;
        return {
          ...p,
          attendance_status: (p.attendance_status as AttendanceStatus) ?? "present",
          display_name,
          is_guest: isGuest,
          born_line: formatBornLine(p.guest_birthplace, p.guest_birthdate),
          signed: !!signed_at,
          signed_at,
        };
      });

      return {
        ...(reg as unknown as DiveRegisterSummary),
        participant_count: participants.length,
        responsible_count: responsibles.length,
        responsibles,
        participants,
      };
    },
  });
};

export const useRegisterMutations = (registerId?: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dive_registers", user?.id] });
    if (registerId) qc.invalidateQueries({ queryKey: ["dive_register", registerId] });
    qc.invalidateQueries({ queryKey: ["register_for_session"] });
    qc.invalidateQueries({ queryKey: ["register_for_event"] });
  };


  const closeRegister = useMutation({
    mutationFn: async (args: { id: string; end_time: string; max_depth_m: number | null }) => {
      const closed = new Date();
      const retention = new Date(closed);
      retention.setMonth(retention.getMonth() + 15);
      const { error } = await supabase
        .from("dive_registers")
        .update({
          status: "chiuso",
          closed_at: closed.toISOString(),
          end_time: args.end_time,
          max_depth_m: args.max_depth_m,
          retention_until: retention.toISOString().slice(0, 10),
        })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Trigger `trg_drp_autolog_del` handles cascade-cleanup of generated dive_logs
  // when participants are removed (or when the register delete cascades them).
  const deleteRegister = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dive_registers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from("dive_register_participants")
        .delete()
        .eq("id", participantId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const assignParticipant = useMutation({
    mutationFn: async (args: { participantId: string; responsibleId: string | null }) => {
      const { error } = await supabase
        .from("dive_register_participants")
        .update({ assigned_responsible_id: args.responsibleId })
        .eq("id", args.participantId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setAttendance = useMutation({
    mutationFn: async (args: { participantId: string; status: AttendanceStatus }) => {
      const { error } = await supabase
        .from("dive_register_participants")
        .update({ attendance_status: args.status })
        .eq("id", args.participantId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Legge 70 outing-level fields. A DB trigger propagates these to every linked
  // dive_log that is not yet signed, so no client-side fan-out is needed.
  const updateOutingFields = useMutation({
    mutationFn: async (args: {
      id: string;
      start_time: string | null;
      end_time?: string | null;
      planned_depth_m?: number | null;
      center_label?: string | null;

    }) => {
      const { id, ...fields } = args;
      const { error } = await supabase.from("dive_registers").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });



  // Trigger `trg_drp_autolog_ins` auto-creates the linked dive_log — single source of truth.
  const addGuest = useMutation({
    mutationFn: async (args: {
      registerId: string;
      nome: string;
      cognome: string;
      birthplace: string;
      birthdate: string;
      agency: string;
      brevettoNumber: string;
    }) => {
      const brevetto = args.brevettoNumber
        ? `${args.agency} · n. ${args.brevettoNumber}`
        : args.agency || null;

      const { error } = await supabase.from("dive_register_participants").insert({
        register_id: args.registerId,
        user_id: null,
        guest_name: `${args.nome} ${args.cognome}`.trim(),
        guest_birthplace: args.birthplace,
        guest_birthdate: args.birthdate,
        brevetto_label: brevetto,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Add a registered user (real account) as a participant. Trigger creates the dive_log
  // owned by that user, so signing flips their own logbook.
  const addMember = useMutation({
    mutationFn: async (args: { registerId: string; userId: string; brevettoLabel?: string | null }) => {
      const { error } = await supabase.from("dive_register_participants").insert({
        register_id: args.registerId,
        user_id: args.userId,
        brevetto_label: args.brevettoLabel ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Import all confirmed/pending participants from the linked session as register participants.
  // Skips users already present. Returns the number of rows inserted.
  const importFromSession = useMutation({
    mutationFn: async (args: { registerId: string; sessionId: string }): Promise<number> => {
      const { data: sps, error: spErr } = await supabase
        .from("session_participants")
        .select("user_id, status")
        .eq("session_id", args.sessionId)
        .in("status", ["pending", "confirmed"]);
      if (spErr) throw spErr;
      const candidateIds = Array.from(new Set((sps ?? []).map((s) => s.user_id).filter(Boolean))) as string[];
      if (candidateIds.length === 0) return 0;

      const { data: existing } = await supabase
        .from("dive_register_participants")
        .select("user_id")
        .eq("register_id", args.registerId)
        .not("user_id", "is", null);
      const existingIds = new Set((existing ?? []).map((p) => p.user_id as string));
      const toInsert = candidateIds.filter((uid) => !existingIds.has(uid));
      if (toInsert.length === 0) return 0;

      const rows = toInsert.map((uid) => ({ register_id: args.registerId, user_id: uid }));
      const { error } = await supabase.from("dive_register_participants").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: invalidate,
  });

  // Same as importFromSession, but sourced from the linked event's participants.
  const importFromEvent = useMutation({
    mutationFn: async (args: { registerId: string; eventId: string }): Promise<number> => {
      const { data: eps, error: epErr } = await supabase
        .from("event_participants")
        .select("user_id, status")
        .eq("event_id", args.eventId)
        .in("status", ["pending", "confirmed"]);
      if (epErr) throw epErr;
      const candidateIds = Array.from(new Set((eps ?? []).map((s) => s.user_id).filter(Boolean))) as string[];
      if (candidateIds.length === 0) return 0;

      const { data: existing } = await supabase
        .from("dive_register_participants")
        .select("user_id")
        .eq("register_id", args.registerId)
        .not("user_id", "is", null);
      const existingIds = new Set((existing ?? []).map((p) => p.user_id as string));
      const toInsert = candidateIds.filter((uid) => !existingIds.has(uid));
      if (toInsert.length === 0) return 0;

      const rows = toInsert.map((uid) => ({ register_id: args.registerId, user_id: uid }));
      const { error } = await supabase.from("dive_register_participants").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: invalidate,
  });

  return {
    closeRegister,
    deleteRegister,
    removeParticipant,
    assignParticipant,
    setAttendance,
    updateOutingFields,
    addGuest,
    addMember,
    importFromSession,
    importFromEvent,
  };
};



export interface CreateRegisterInput {
  title: string;
  spot_id: string | null;
  spot_label: string | null;
  register_date: string;
  start_time: string | null;
  org_group_id: string | null;
  safety_checklist?: Record<string, boolean>;
}

export const useCreateRegister = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRegisterInput) => {
      if (!user) throw new Error("not_authenticated");
      const { data: reg, error } = await supabase
        .from("dive_registers")
        .insert({
          created_by: user.id,
          title: input.title,
          spot_id: input.spot_id,
          spot_label: input.spot_label,
          register_date: input.register_date,
          start_time: input.start_time,
          org_group_id: input.org_group_id,
          status: "aperto",
          opened_at: input.start_time
            ? new Date(`${input.register_date}T${input.start_time}`).toISOString()
            : new Date().toISOString(),
          safety_checklist: input.safety_checklist ?? {},
        })
        .select("id")
        .single();
      if (error) throw error;
      // Insert current user as first responsible
      await supabase.from("dive_register_responsibles").insert({
        register_id: reg.id,
        instructor_user_id: user.id,
        is_school: !!input.org_group_id,
      });
      return reg.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dive_registers", user?.id] }),
  });
};
