import { t } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const reauth = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(t("pwdBad"));
};

/** Path A: sign all libretti of a responsible group (register must be chiuso). */
export const useSignLibrettiGroup = (registerId?: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, password }: { groupId: string; password: string }) => {
      if (!user?.email) throw new Error(t("signErrInvalidSession"));
      await reauth(user.email, password);
      const { data, error } = await supabase.rpc("sign_libretti_group", {
        _register_id: registerId!,
        _group_id: groupId,
      });
      if (error) throw new Error(error.message);
      return data as unknown as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dive_register", registerId] });
      qc.invalidateQueries({ queryKey: ["libretti_groups", registerId] });
      qc.invalidateQueries({ queryKey: ["dive_logs"] });
      qc.invalidateQueries({ queryKey: ["register_for_session"] });
      qc.invalidateQueries({ queryKey: ["register_for_event"] });
    },
  });
};

/** Sign a set of register participants (or all present) — enabled from register_date. */
export const useSignParticipants = (registerId?: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      participantIds,
      password,
    }: {
      participantIds: string[] | null;
      password: string;
    }): Promise<number> => {
      if (!user?.email) throw new Error(t("signErrInvalidSession"));
      await reauth(user.email, password);
      const { data, error } = await supabase.rpc("sign_participants", {
        _register_id: registerId!,
        _participant_ids: participantIds,
      });
      if (error) {
        if (error.message.includes("session_not_started")) throw new Error(t("rdSignNotStarted"));
        if (error.message.includes("not_authorized")) throw new Error(t("signErrNotInstructor"));
        throw new Error(error.message);
      }
      return (data ?? 0) as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dive_register", registerId] });
      qc.invalidateQueries({ queryKey: ["libretti_groups", registerId] });
      qc.invalidateQueries({ queryKey: ["dive_logs"] });
      qc.invalidateQueries({ queryKey: ["register_for_session"] });
      qc.invalidateQueries({ queryKey: ["register_for_event"] });
    },
  });
};

/** Autofirma: instructor signs their own guided dive log. */
export const useAutofirma = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ diveLogId, password }: { diveLogId: string; password: string }) => {
      if (!user?.email) throw new Error(t("signErrInvalidSession"));
      await reauth(user.email, password);
      const now = new Date().toISOString();
      const { error: sigErr } = await supabase.from("dive_log_signatures").insert({
        dive_log_id: diveLogId,
        verifier_user_id: user.id,
        method: "autofirma",
        credential_confirmed_at: now,
      });
      if (sigErr) throw new Error(sigErr.message);
      const { error: upErr } = await supabase
        .from("dive_logs")
        .update({ verification_status: "verified" })
        .eq("id", diveLogId);
      if (upErr) throw new Error(upErr.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dive_log"] });
      qc.invalidateQueries({ queryKey: ["dive_logs"] });
    },
  });
};

/** Issue a QR signing token (Path B, instructor side). */
export const useIssueSigningToken = () => {
  return useMutation({
    mutationFn: async (password: string): Promise<{ token: string; expires_at: string }> => {
      const { data, error } = await supabase.functions.invoke("sign-qr-issue", {
        body: { password },
      });
      if (error) {
        const msg = (data as { error?: string } | null)?.error;
        if (msg === "bad_password") throw new Error(t("pwdBad"));
        if (msg === "not_instructor") throw new Error(t("signErrNotInstructor"));
        if (msg === "rate_limited") throw new Error(t("signErrRateLimited"));
        throw new Error(error.message);
      }
      const payload = data as { token?: string; expires_at?: string; error?: string };
      if (payload.error) {
        if (payload.error === "bad_password") throw new Error(t("pwdBad"));
        if (payload.error === "not_instructor") throw new Error(t("signErrNotInstructor"));
        if (payload.error === "rate_limited") throw new Error(t("signErrRateLimited"));
        throw new Error(payload.error);
      }
      if (!payload.token || !payload.expires_at) throw new Error(t("signErrInvalidResponse"));
      return { token: payload.token, expires_at: payload.expires_at };
    },
  });
};

/** Redeem a QR signing token (Path B, student side). */
export const useRedeemSigningToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      diveLogId,
      token,
    }: {
      diveLogId: string;
      token: string;
    }): Promise<{ verifier: { name: string | null; last_name: string | null } }> => {
      const { data, error } = await supabase.functions.invoke("sign-qr-redeem", {
        body: { dive_log_id: diveLogId, token },
      });
      if (error) {
        const payload = data as { error?: string } | null;
        const msg = payload?.error ?? error.message;
        if (msg === "invalid_token") throw new Error(t("signErrInvalidToken"));
        if (msg === "token_used") throw new Error(t("signErrTokenUsed"));
        if (msg === "token_expired") throw new Error(t("signErrTokenExpired"));
        if (msg === "already_signed") throw new Error(t("signErrAlreadySigned"));
        if (msg === "not_guided") throw new Error(t("signErrNotGuided"));
        if (msg === "record_not_found") throw new Error(t("signErrRecordNotFound"));
        throw new Error(msg);
      }
      const payload = data as { ok?: boolean; error?: string; verifier?: { name: string | null; last_name: string | null } };
      if (payload.error) {
        if (payload.error === "invalid_token") throw new Error(t("signErrInvalidToken"));
        if (payload.error === "token_used") throw new Error(t("signErrTokenUsed"));
        if (payload.error === "token_expired") throw new Error(t("signErrTokenExpired"));
        if (payload.error === "already_signed") throw new Error(t("signErrAlreadySigned"));
        if (payload.error === "not_guided") throw new Error(t("signErrNotGuided"));
        if (payload.error === "record_not_found") throw new Error(t("signErrRecordNotFound"));
        throw new Error(payload.error);
      }
      qc.invalidateQueries({ queryKey: ["dive_log"] });
      qc.invalidateQueries({ queryKey: ["dive_logs"] });
      return { verifier: payload.verifier ?? { name: null, last_name: null } };
    },
  });
};

/** Ask a specific instructor to sign one of my dive logs (Legge 70 R-005/R-006). */
export const useRequestLogSignature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ diveLogId, instructorUserId }: { diveLogId: string; instructorUserId: string }) => {
      const { data, error } = await supabase.rpc("request_log_signature", {
        _log_id: diveLogId,
        _instructor_user_id: instructorUserId,
      });
      if (error) {
        if (error.message.includes("self_request")) throw new Error(t("signErrSelfRequest"));
        if (error.message.includes("not_instructor")) throw new Error(t("signErrNotInstructor"));
        if (error.message.includes("already_signed")) throw new Error(t("signErrAlreadySigned"));
        throw new Error(error.message);
      }
      return data as unknown as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dive_log"] });
      qc.invalidateQueries({ queryKey: ["signature_requests"] });
    },
  });
};

/** Pending signature requests addressed to the current instructor for a dive log. */
export const usePendingSignatureRequest = (diveLogId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["signature_requests", diveLogId, user?.id],
    enabled: !!diveLogId && !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("dive_log_signature_requests")
        .select("id")
        .eq("dive_log_id", diveLogId!)
        .eq("instructor_user_id", user!.id)
        .eq("status", "pending")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};

/** Instructor signs a dive log they were explicitly asked to sign. */
export const useSignRequestedLog = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ diveLogId, password }: { diveLogId: string; password: string }) => {
      if (!user?.email) throw new Error(t("signErrInvalidSession"));
      await reauth(user.email, password);
      const { error } = await supabase.rpc("sign_requested_log", { _log_id: diveLogId });
      if (error) {
        if (error.message.includes("self_sign")) throw new Error(t("signErrSelfSign"));
        if (error.message.includes("already_signed")) throw new Error(t("signErrAlreadySigned"));
        if (error.message.includes("no_pending_request")) throw new Error(t("signErrNoRequest"));
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dive_log"] });
      qc.invalidateQueries({ queryKey: ["dive_logs"] });
      qc.invalidateQueries({ queryKey: ["signature_requests"] });
    },
  });
};
