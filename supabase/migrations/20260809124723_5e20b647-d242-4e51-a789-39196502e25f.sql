-- ============================================================
-- 20260717084810_719dff5c-fa87-4bc3-ae7c-bfeeb87d4ff5.sql
-- ============================================================

-- =========================================================
-- Phase 1: Logbook & Legal Register — tables, grants, RLS
-- =========================================================

-- 1) dive_registers
CREATE TABLE public.dive_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_group_id uuid REFERENCES public.groups(id),
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  spot_id uuid REFERENCES public.spots(id),
  spot_label text,
  register_date date NOT NULL,
  start_time time,
  end_time time,
  status text NOT NULL DEFAULT 'da_aprire' CHECK (status IN ('da_aprire','aperto','chiuso')),
  max_depth_m numeric,
  opened_at timestamptz,
  closed_at timestamptz,
  retention_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dive_registers TO authenticated;
GRANT ALL ON public.dive_registers TO service_role;
ALTER TABLE public.dive_registers ENABLE ROW LEVEL SECURITY;

-- 2) dive_register_responsibles
CREATE TABLE public.dive_register_responsibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES public.dive_registers(id) ON DELETE CASCADE,
  instructor_user_id uuid NOT NULL REFERENCES auth.users(id),
  brevetto_label text,
  is_school boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (register_id, instructor_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dive_register_responsibles TO authenticated;
GRANT ALL ON public.dive_register_responsibles TO service_role;
ALTER TABLE public.dive_register_responsibles ENABLE ROW LEVEL SECURITY;

-- 3) dive_logs
CREATE TABLE public.dive_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  register_id uuid REFERENCES public.dive_registers(id) ON DELETE SET NULL,
  outing_type text NOT NULL CHECK (outing_type IN ('guided','free')),
  discipline text NOT NULL,
  spot_id uuid REFERENCES public.spots(id),
  spot_label text,
  dive_date date NOT NULL,
  start_time time,
  end_time time,
  planned_depth_m numeric,
  reached_depth_m numeric,
  dives_count int,
  notes text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','verified','self_signed')),
  center_label text,
  instructor_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dive_logs TO authenticated;
GRANT ALL ON public.dive_logs TO service_role;
ALTER TABLE public.dive_logs ENABLE ROW LEVEL SECURITY;

-- 4) dive_register_participants
CREATE TABLE public.dive_register_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES public.dive_registers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  guest_name text,
  guest_birthplace text,
  guest_birthdate date,
  brevetto_label text,
  assigned_responsible_id uuid REFERENCES public.dive_register_responsibles(id) ON DELETE SET NULL,
  dive_log_id uuid REFERENCES public.dive_logs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dive_register_participants TO authenticated;
GRANT ALL ON public.dive_register_participants TO service_role;
ALTER TABLE public.dive_register_participants ENABLE ROW LEVEL SECURITY;

-- 5) dive_log_signatures
CREATE TABLE public.dive_log_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dive_log_id uuid NOT NULL UNIQUE REFERENCES public.dive_logs(id) ON DELETE CASCADE,
  verifier_user_id uuid NOT NULL REFERENCES auth.users(id),
  verifier_brevetto_label text,
  method text NOT NULL DEFAULT 'credential' CHECK (method IN ('credential','qr','autofirma')),
  credential_confirmed_at timestamptz NOT NULL DEFAULT now(),
  requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dive_log_signatures TO authenticated;
GRANT ALL ON public.dive_log_signatures TO service_role;
ALTER TABLE public.dive_log_signatures ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Helper functions
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_dive_register_manager(_uid uuid, _register_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dive_registers r
    WHERE r.id = _register_id
      AND (
        r.created_by = _uid
        OR (r.org_group_id IS NOT NULL AND public.is_group_owner(_uid, r.org_group_id))
        OR EXISTS (
          SELECT 1 FROM public.dive_register_responsibles rr
          WHERE rr.register_id = r.id AND rr.instructor_user_id = _uid
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_dive_log(_uid uuid, _log_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dive_logs l
    WHERE l.id = _log_id
      AND (
        l.user_id = _uid
        OR (l.register_id IS NOT NULL AND public.is_dive_register_manager(_uid, l.register_id))
        OR EXISTS (
          SELECT 1 FROM public.dive_register_participants p
          JOIN public.dive_register_responsibles rr ON rr.id = p.assigned_responsible_id
          WHERE p.dive_log_id = l.id AND rr.instructor_user_id = _uid
        )
      )
  )
$$;

-- =========================================================
-- Triggers: closure lock & retention
-- =========================================================
CREATE OR REPLACE FUNCTION public.dive_registers_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'chiuso' THEN
    RAISE EXCEPTION 'register_chiuso_immutable';
  END IF;
  IF NEW.status = 'chiuso' AND OLD.status <> 'chiuso' THEN
    NEW.closed_at := now();
    NEW.retention_until := (current_date + interval '15 months')::date;
  END IF;
  IF NEW.status = 'aperto' AND OLD.status = 'da_aprire' AND NEW.opened_at IS NULL THEN
    NEW.opened_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_dive_registers_before_update
BEFORE UPDATE ON public.dive_registers
FOR EACH ROW EXECUTE FUNCTION public.dive_registers_before_update();

CREATE OR REPLACE FUNCTION public.dive_registers_before_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'chiuso' THEN
    RAISE EXCEPTION 'register_chiuso_immutable';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER trg_dive_registers_before_delete
BEFORE DELETE ON public.dive_registers
FOR EACH ROW EXECUTE FUNCTION public.dive_registers_before_delete();

CREATE OR REPLACE FUNCTION public.dive_logs_guard_closed_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _rid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _rid := OLD.register_id;
  ELSE
    _rid := COALESCE(NEW.register_id, OLD.register_id);
  END IF;
  IF _rid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.dive_registers r WHERE r.id = _rid AND r.status = 'chiuso'
  ) THEN
    RAISE EXCEPTION 'register_chiuso_locked';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
CREATE TRIGGER trg_dive_logs_guard_update
BEFORE UPDATE ON public.dive_logs
FOR EACH ROW EXECUTE FUNCTION public.dive_logs_guard_closed_register();
CREATE TRIGGER trg_dive_logs_guard_delete
BEFORE DELETE ON public.dive_logs
FOR EACH ROW EXECUTE FUNCTION public.dive_logs_guard_closed_register();

-- updated_at triggers
CREATE TRIGGER trg_dive_registers_updated_at
BEFORE UPDATE ON public.dive_registers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_dive_logs_updated_at
BEFORE UPDATE ON public.dive_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RLS policies
-- =========================================================

-- dive_registers
CREATE POLICY "Managers can view registers"
ON public.dive_registers FOR SELECT TO authenticated
USING (public.is_dive_register_manager(auth.uid(), id));

CREATE POLICY "Users can create their own registers"
ON public.dive_registers FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (org_group_id IS NULL OR public.is_group_owner(auth.uid(), org_group_id))
);

CREATE POLICY "Managers can update registers"
ON public.dive_registers FOR UPDATE TO authenticated
USING (public.is_dive_register_manager(auth.uid(), id))
WITH CHECK (public.is_dive_register_manager(auth.uid(), id));

CREATE POLICY "Managers can delete registers"
ON public.dive_registers FOR DELETE TO authenticated
USING (public.is_dive_register_manager(auth.uid(), id));

-- dive_register_responsibles
CREATE POLICY "Managers view responsibles"
ON public.dive_register_responsibles FOR SELECT TO authenticated
USING (public.is_dive_register_manager(auth.uid(), register_id));

CREATE POLICY "Managers insert responsibles when open"
ON public.dive_register_responsibles FOR INSERT TO authenticated
WITH CHECK (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
);

CREATE POLICY "Managers update responsibles when open"
ON public.dive_register_responsibles FOR UPDATE TO authenticated
USING (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
)
WITH CHECK (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
);

CREATE POLICY "Managers delete responsibles when open"
ON public.dive_register_responsibles FOR DELETE TO authenticated
USING (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
);

-- dive_register_participants
CREATE POLICY "Managers view participants"
ON public.dive_register_participants FOR SELECT TO authenticated
USING (public.is_dive_register_manager(auth.uid(), register_id));

CREATE POLICY "Managers insert participants when open"
ON public.dive_register_participants FOR INSERT TO authenticated
WITH CHECK (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
);

CREATE POLICY "Managers update participants when open"
ON public.dive_register_participants FOR UPDATE TO authenticated
USING (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
)
WITH CHECK (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
);

CREATE POLICY "Managers delete participants when open"
ON public.dive_register_participants FOR DELETE TO authenticated
USING (
  public.is_dive_register_manager(auth.uid(), register_id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_registers r WHERE r.id = register_id AND r.status = 'chiuso')
);

-- dive_logs
CREATE POLICY "Owner or authorized can view dive logs"
ON public.dive_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.can_view_dive_log(auth.uid(), id));

CREATE POLICY "Owner can insert own dive logs"
ON public.dive_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own dive logs"
ON public.dive_logs FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own dive logs"
ON public.dive_logs FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- dive_log_signatures
CREATE POLICY "Owner or verifier can view signatures"
ON public.dive_log_signatures FOR SELECT TO authenticated
USING (
  verifier_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.dive_logs l WHERE l.id = dive_log_id AND l.user_id = auth.uid())
);

CREATE POLICY "Assigned responsible or manager can insert signatures"
ON public.dive_log_signatures FOR INSERT TO authenticated
WITH CHECK (
  verifier_user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.dive_register_participants p
      JOIN public.dive_register_responsibles rr ON rr.id = p.assigned_responsible_id
      WHERE p.dive_log_id = dive_log_signatures.dive_log_id
        AND rr.instructor_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dive_logs l
      WHERE l.id = dive_log_signatures.dive_log_id
        AND l.register_id IS NOT NULL
        AND public.is_dive_register_manager(auth.uid(), l.register_id)
    )
  )
);

CREATE POLICY "Owner or verifier can delete signatures"
ON public.dive_log_signatures FOR DELETE TO authenticated
USING (
  verifier_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.dive_logs l WHERE l.id = dive_log_id AND l.user_id = auth.uid())
);

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX idx_dive_logs_user_id ON public.dive_logs(user_id);
CREATE INDEX idx_dive_logs_register_id ON public.dive_logs(register_id);
CREATE INDEX idx_dive_registers_org_group_id ON public.dive_registers(org_group_id);
CREATE INDEX idx_dive_registers_created_by ON public.dive_registers(created_by);
CREATE INDEX idx_dive_registers_session_id ON public.dive_registers(session_id);
CREATE INDEX idx_dive_register_participants_register_id ON public.dive_register_participants(register_id);
CREATE INDEX idx_dive_register_participants_user_id ON public.dive_register_participants(user_id);
CREATE INDEX idx_dive_register_responsibles_register_id ON public.dive_register_responsibles(register_id);


-- ============================================================
-- 20260717095513_ae9e40fc-f19a-4992-82d0-da688f2f04c6.sql
-- ============================================================

CREATE TABLE public.signing_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  dive_log_id uuid REFERENCES public.dive_logs(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.signing_tokens TO authenticated;
GRANT ALL ON public.signing_tokens TO service_role;
ALTER TABLE public.signing_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifier can view own signing tokens"
ON public.signing_tokens FOR SELECT TO authenticated
USING (verifier_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS signing_tokens_verifier_idx ON public.signing_tokens(verifier_user_id);
CREATE INDEX IF NOT EXISTS signing_tokens_expires_idx ON public.signing_tokens(expires_at);

DROP POLICY IF EXISTS "Assigned responsible or manager can insert signatures" ON public.dive_log_signatures;

CREATE POLICY "Assigned responsible, manager, or autofirma can insert signatures"
ON public.dive_log_signatures FOR INSERT TO authenticated
WITH CHECK (
  verifier_user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.dive_register_participants p
      JOIN public.dive_register_responsibles rr ON rr.id = p.assigned_responsible_id
      WHERE p.dive_log_id = dive_log_signatures.dive_log_id
        AND rr.instructor_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dive_logs l
      WHERE l.id = dive_log_signatures.dive_log_id
        AND l.register_id IS NOT NULL
        AND public.is_dive_register_manager(auth.uid(), l.register_id)
    )
    OR (
      method = 'autofirma'
      AND public.has_role(auth.uid(), 'instructor')
      AND EXISTS (
        SELECT 1 FROM public.dive_logs l
        WHERE l.id = dive_log_signatures.dive_log_id
          AND l.user_id = auth.uid()
          AND l.outing_type = 'guided'
      )
    )
  )
);

CREATE OR REPLACE FUNCTION public.sign_libretti_group(_register_id uuid, _group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _brevetto text;
  _found boolean;
  _count integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT true, brevetto_label INTO _found, _brevetto
  FROM public.dive_register_responsibles
  WHERE id = _group_id AND register_id = _register_id AND instructor_user_id = _uid;

  IF NOT COALESCE(_found, false) THEN
    RAISE EXCEPTION 'not_assigned_responsible';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dive_registers
    WHERE id = _register_id AND status = 'chiuso'
  ) THEN
    RAISE EXCEPTION 'register_not_closed';
  END IF;

  WITH inserted AS (
    INSERT INTO public.dive_log_signatures (dive_log_id, verifier_user_id, verifier_brevetto_label, method, credential_confirmed_at)
    SELECT p.dive_log_id, _uid, _brevetto, 'credential', now()
    FROM public.dive_register_participants p
    JOIN public.dive_logs l ON l.id = p.dive_log_id
    WHERE p.register_id = _register_id
      AND p.assigned_responsible_id = _group_id
      AND p.dive_log_id IS NOT NULL
      AND l.verification_status <> 'verified'
    ON CONFLICT (dive_log_id) DO NOTHING
    RETURNING dive_log_id
  )
  UPDATE public.dive_logs
  SET verification_status = 'verified'
  WHERE id IN (SELECT dive_log_id FROM inserted);

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.sign_libretti_group(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.sign_libretti_group(uuid, uuid) TO authenticated;