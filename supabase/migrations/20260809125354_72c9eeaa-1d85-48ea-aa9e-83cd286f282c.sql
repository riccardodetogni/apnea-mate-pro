-- ============================================================
-- 20260717103940_58b47a51-698c-493b-888d-33832f19a09c.sql
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instructor_brevetto_label text;


-- ============================================================
-- 20260729125123_b3b66562-f85c-4fb5-8027-c02a5997e202.sql
-- ============================================================

-- 1) Attendance status on register participants
ALTER TABLE public.dive_register_participants
  ADD COLUMN IF NOT EXISTS attendance_status text NOT NULL DEFAULT 'present';

ALTER TABLE public.dive_register_participants
  DROP CONSTRAINT IF EXISTS dive_register_participants_attendance_chk;
ALTER TABLE public.dive_register_participants
  ADD CONSTRAINT dive_register_participants_attendance_chk
  CHECK (attendance_status IN ('present','absent','not_participating'));

-- 2) Relax sign_libretti_group: allow from register_date onward, any status
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
    WHERE id = _register_id AND register_date <= current_date
  ) THEN
    RAISE EXCEPTION 'session_not_started';
  END IF;

  WITH inserted AS (
    INSERT INTO public.dive_log_signatures (dive_log_id, verifier_user_id, verifier_brevetto_label, method, credential_confirmed_at)
    SELECT p.dive_log_id, _uid, _brevetto, 'credential', now()
    FROM public.dive_register_participants p
    JOIN public.dive_logs l ON l.id = p.dive_log_id
    WHERE p.register_id = _register_id
      AND p.assigned_responsible_id = _group_id
      AND p.dive_log_id IS NOT NULL
      AND p.attendance_status = 'present'
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

-- 3) New RPC: sign a set (or all) present participants of a register
CREATE OR REPLACE FUNCTION public.sign_participants(
  _register_id uuid,
  _participant_ids uuid[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _brevetto text;
  _count integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT (public.is_dive_register_manager(_uid, _register_id) OR public.has_role(_uid, 'admin')) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dive_registers
    WHERE id = _register_id AND register_date <= current_date
  ) THEN
    RAISE EXCEPTION 'session_not_started';
  END IF;

  -- Pick verifier brevetto: prefer the responsible row for this instructor on this register
  SELECT brevetto_label INTO _brevetto
  FROM public.dive_register_responsibles
  WHERE register_id = _register_id AND instructor_user_id = _uid
  LIMIT 1;

  IF _brevetto IS NULL THEN
    SELECT instructor_brevetto_label INTO _brevetto
    FROM public.profiles WHERE user_id = _uid;
  END IF;

  WITH inserted AS (
    INSERT INTO public.dive_log_signatures (dive_log_id, verifier_user_id, verifier_brevetto_label, method, credential_confirmed_at)
    SELECT p.dive_log_id, _uid, _brevetto, 'credential', now()
    FROM public.dive_register_participants p
    JOIN public.dive_logs l ON l.id = p.dive_log_id
    WHERE p.register_id = _register_id
      AND p.dive_log_id IS NOT NULL
      AND p.attendance_status = 'present'
      AND l.verification_status <> 'verified'
      AND (_participant_ids IS NULL OR p.id = ANY(_participant_ids))
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

REVOKE ALL ON FUNCTION public.sign_participants(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.sign_participants(uuid, uuid[]) TO authenticated;

-- 4) Auto-create register when an instructor/admin creates a session
CREATE OR REPLACE FUNCTION public.ensure_register_for_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_staff boolean;
  _spot_name text;
  _spot_loc text;
  _spot_label text;
  _group_verified boolean := false;
  _new_reg_id uuid;
BEGIN
  -- Only for instructor/admin creators
  SELECT (public.has_role(NEW.creator_id, 'instructor') OR public.has_role(NEW.creator_id, 'admin'))
    INTO _is_staff;
  IF NOT COALESCE(_is_staff, false) THEN
    RETURN NEW;
  END IF;

  -- Idempotency: skip if already linked
  IF EXISTS (SELECT 1 FROM public.dive_registers WHERE session_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF NEW.spot_id IS NOT NULL THEN
    SELECT name, location INTO _spot_name, _spot_loc
    FROM public.spots WHERE id = NEW.spot_id;
    IF _spot_name IS NOT NULL THEN
      _spot_label := _spot_name || COALESCE(' · ' || _spot_loc, '');
    END IF;
  END IF;

  IF NEW.group_id IS NOT NULL THEN
    SELECT verified INTO _group_verified FROM public.groups WHERE id = NEW.group_id;
  END IF;

  INSERT INTO public.dive_registers (
    created_by, session_id, org_group_id, title, spot_id, spot_label,
    register_date, start_time, status, safety_checklist
  ) VALUES (
    NEW.creator_id,
    NEW.id,
    CASE WHEN COALESCE(_group_verified, false) THEN NEW.group_id ELSE NULL END,
    NEW.title,
    NEW.spot_id,
    _spot_label,
    (NEW.date_time AT TIME ZONE 'UTC')::date,
    (NEW.date_time AT TIME ZONE 'UTC')::time,
    'da_aprire',
    '{}'::jsonb
  )
  RETURNING id INTO _new_reg_id;

  INSERT INTO public.dive_register_responsibles (register_id, instructor_user_id, is_school)
  VALUES (_new_reg_id, NEW.creator_id, COALESCE(_group_verified, false));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sessions_ensure_register ON public.sessions;
CREATE TRIGGER trg_sessions_ensure_register
  AFTER INSERT ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_register_for_session();

-- 5) Set-attendance policy note: existing UPDATE policy on dive_register_participants
-- must allow the register manager to update attendance_status. Check existing update policy;
-- if it restricts fields, we don't need to change it because policies check row-level, not columns.


-- ============================================================
-- 20260729205819_e793b0d4-62ea-454a-9496-2f898f2d2cbd.sql
-- ============================================================
-- 1) Fix existing autolog: set default discipline to satisfy NOT NULL
CREATE OR REPLACE FUNCTION public.dive_register_participants_autolog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reg record;
  _log_id uuid;
  _owner uuid;
BEGIN
  IF NEW.dive_log_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, created_by, spot_id, spot_label, register_date
    INTO _reg
  FROM public.dive_registers
  WHERE id = NEW.register_id;

  IF _reg.id IS NULL THEN
    RAISE EXCEPTION 'register_not_found';
  END IF;

  _owner := COALESCE(NEW.user_id, _reg.created_by);

  INSERT INTO public.dive_logs (
    user_id, register_id, outing_type, discipline, spot_id, spot_label,
    dive_date, verification_status
  ) VALUES (
    _owner, _reg.id, 'guided', 'CWT', _reg.spot_id, _reg.spot_label,
    _reg.register_date, 'unverified'
  )
  RETURNING id INTO _log_id;

  NEW.dive_log_id := _log_id;
  RETURN NEW;
END;
$$;

-- 2) Idempotency index for the sync
CREATE UNIQUE INDEX IF NOT EXISTS uq_drp_register_user
  ON public.dive_register_participants(register_id, user_id)
  WHERE user_id IS NOT NULL;

-- 3) Sync trigger session_participants -> dive_register_participants
CREATE OR REPLACE FUNCTION public.sync_confirmed_to_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_register_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'confirmed'
         AND OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT id INTO v_register_id
      FROM public.dive_registers
      WHERE session_id = NEW.session_id
      LIMIT 1;
    IF v_register_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.dive_register_participants(register_id, user_id)
        VALUES (v_register_id, NEW.user_id)
        ON CONFLICT ON CONSTRAINT uq_drp_register_user DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled'
        AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    DELETE FROM public.dive_register_participants drp
      USING public.dive_registers dr
      WHERE dr.id = drp.register_id
        AND dr.session_id = NEW.session_id
        AND drp.user_id = NEW.user_id
        AND (drp.dive_log_id IS NULL
             OR NOT EXISTS (
               SELECT 1 FROM public.dive_log_signatures s
               WHERE s.dive_log_id = drp.dive_log_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sp_sync_register ON public.session_participants;
CREATE TRIGGER trg_sp_sync_register
  AFTER INSERT OR UPDATE OF status ON public.session_participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_confirmed_to_register();

-- 4) Backfill for existing confirmed session participants
INSERT INTO public.dive_register_participants(register_id, user_id)
SELECT dr.id, sp.user_id
  FROM public.session_participants sp
  JOIN public.dive_registers dr ON dr.session_id = sp.session_id
 WHERE sp.status = 'confirmed'
   AND sp.user_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.dive_register_participants x
      WHERE x.register_id = dr.id AND x.user_id = sp.user_id
   );

-- ============================================================
-- 20260730131056_8da1cac1-f4fd-4e3d-80ab-d33ed82bf268.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_confirmed_to_register()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_register_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'confirmed'
         AND OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT id INTO v_register_id
      FROM public.dive_registers
      WHERE session_id = NEW.session_id
      LIMIT 1;
    IF v_register_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.dive_register_participants(register_id, user_id)
        VALUES (v_register_id, NEW.user_id)
        ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled'
        AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    DELETE FROM public.dive_register_participants drp
      USING public.dive_registers dr
      WHERE dr.id = drp.register_id
        AND dr.session_id = NEW.session_id
        AND drp.user_id = NEW.user_id
        AND (drp.dive_log_id IS NULL
             OR NOT EXISTS (
               SELECT 1 FROM public.dive_log_signatures s
               WHERE s.dive_log_id = drp.dive_log_id));
  END IF;
  RETURN NEW;
END;
$function$;
