-- ============================================================
-- 20260805141145_c946fbe2-f6a8-410e-999e-40d8ce5e798a.sql
-- ============================================================
-- 1. New dive_log fields (Legge 70 template columns)
ALTER TABLE public.dive_logs
  ADD COLUMN IF NOT EXISTS breathing_apparatus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gas_mix text;

-- 2. Registers can be linked to events
ALTER TABLE public.dive_registers
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS dive_registers_event_id_uniq ON public.dive_registers(event_id) WHERE event_id IS NOT NULL;

-- 3. Session registers: skip pool / deep pool / spearfishing, only confirmed participants
CREATE OR REPLACE FUNCTION public.ensure_register_for_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_staff boolean;
  _spot_name text;
  _spot_loc text;
  _spot_env text;
  _spot_label text;
  _group_verified boolean := false;
  _group_name text;
  _new_reg_id uuid;
BEGIN
  SELECT (public.has_role(NEW.creator_id, 'instructor') OR public.has_role(NEW.creator_id, 'admin'))
    INTO _is_staff;
  IF NOT COALESCE(_is_staff, false) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.dive_registers WHERE session_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF NEW.spot_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- No register required for spearfishing outings
  IF NEW.session_type = 'spearfishing' THEN
    RETURN NEW;
  END IF;

  SELECT name, location, environment_type INTO _spot_name, _spot_loc, _spot_env
  FROM public.spots WHERE id = NEW.spot_id;

  -- No register required in pools (including deep pools such as Y-40)
  IF _spot_env IN ('pool', 'deep_pool') THEN
    RETURN NEW;
  END IF;

  IF _spot_name IS NOT NULL THEN
    _spot_label := _spot_name || COALESCE(' · ' || _spot_loc, '');
  END IF;

  IF NEW.group_id IS NOT NULL THEN
    SELECT verified, name INTO _group_verified, _group_name FROM public.groups WHERE id = NEW.group_id;
  END IF;

  INSERT INTO public.dive_registers (
    created_by, session_id, org_group_id, title, spot_id, spot_label,
    register_date, start_time, status, safety_checklist, center_label
  ) VALUES (
    NEW.creator_id,
    NEW.id,
    CASE WHEN COALESCE(_group_verified, false) THEN NEW.group_id ELSE NULL END,
    NEW.title,
    NEW.spot_id,
    _spot_label,
    (NEW.date_time AT TIME ZONE 'Europe/Rome')::date,
    (NEW.date_time AT TIME ZONE 'Europe/Rome')::time,
    'da_aprire',
    '{}'::jsonb,
    _group_name
  )
  RETURNING id INTO _new_reg_id;

  INSERT INTO public.dive_register_responsibles (register_id, instructor_user_id, is_school)
  VALUES (_new_reg_id, NEW.creator_id, COALESCE(_group_verified, false));

  INSERT INTO public.dive_register_participants (register_id, user_id)
  SELECT _new_reg_id, sp.user_id
  FROM public.session_participants sp
  WHERE sp.session_id = NEW.id
    AND sp.status = 'confirmed'
    AND sp.user_id IS NOT NULL
  ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 4. Session participants sync: only confirmed participants land in the register
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
         AND OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT id INTO v_register_id
      FROM public.dive_registers
      WHERE session_id = NEW.session_id
      LIMIT 1;
    IF v_register_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.dive_register_participants(register_id, user_id)
        VALUES (v_register_id, NEW.user_id)
        ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('cancelled', 'pending', 'rejected')
        AND OLD.status IS DISTINCT FROM NEW.status THEN
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

-- 5. Event registers (trip / stage only)
CREATE OR REPLACE FUNCTION public.ensure_register_for_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_staff boolean;
  _group_verified boolean := false;
  _group_name text;
  _new_reg_id uuid;
BEGIN
  IF NEW.event_type NOT IN ('trip', 'stage') THEN
    RETURN NEW;
  END IF;

  SELECT (public.has_role(NEW.creator_id, 'instructor') OR public.has_role(NEW.creator_id, 'admin'))
    INTO _is_staff;
  IF NOT COALESCE(_is_staff, false) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.dive_registers WHERE event_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF NEW.group_id IS NOT NULL THEN
    SELECT verified, name INTO _group_verified, _group_name FROM public.groups WHERE id = NEW.group_id;
  END IF;

  INSERT INTO public.dive_registers (
    created_by, event_id, org_group_id, title, spot_label,
    register_date, status, safety_checklist, center_label
  ) VALUES (
    NEW.creator_id,
    NEW.id,
    CASE WHEN COALESCE(_group_verified, false) THEN NEW.group_id ELSE NULL END,
    NEW.title,
    NEW.location,
    NEW.start_date,
    'da_aprire',
    '{}'::jsonb,
    _group_name
  )
  RETURNING id INTO _new_reg_id;

  INSERT INTO public.dive_register_responsibles (register_id, instructor_user_id, is_school)
  VALUES (_new_reg_id, NEW.creator_id, COALESCE(_group_verified, false));

  INSERT INTO public.dive_register_participants (register_id, user_id)
  SELECT _new_reg_id, ep.user_id
  FROM public.event_participants ep
  WHERE ep.event_id = NEW.id
    AND ep.status = 'confirmed'
    AND ep.user_id IS NOT NULL
  ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_ensure_register_for_event ON public.events;
CREATE TRIGGER trg_ensure_register_for_event
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.ensure_register_for_event();

CREATE OR REPLACE FUNCTION public.sync_event_confirmed_to_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_register_id uuid;
BEGIN
  SELECT id INTO v_register_id FROM public.dive_registers WHERE event_id = NEW.event_id LIMIT 1;
  IF v_register_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.dive_register_participants(register_id, user_id)
        VALUES (v_register_id, NEW.user_id)
        ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('cancelled', 'pending', 'rejected')
        AND OLD.status IS DISTINCT FROM NEW.status THEN
    DELETE FROM public.dive_register_participants drp
      WHERE drp.register_id = v_register_id
        AND drp.user_id = NEW.user_id
        AND (drp.dive_log_id IS NULL
             OR NOT EXISTS (
               SELECT 1 FROM public.dive_log_signatures s
               WHERE s.dive_log_id = drp.dive_log_id));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_event_confirmed_to_register ON public.event_participants;
CREATE TRIGGER trg_sync_event_confirmed_to_register
AFTER INSERT OR UPDATE ON public.event_participants
FOR EACH ROW EXECUTE FUNCTION public.sync_event_confirmed_to_register();

-- 6. Signing timing: only from the actual start of the outing
CREATE OR REPLACE FUNCTION public.register_has_started(_register_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.dive_registers r
    WHERE r.id = _register_id
      AND (r.register_date + COALESCE(r.start_time, time '00:00'))
          <= (now() AT TIME ZONE 'Europe/Rome')
  )
$function$;

CREATE OR REPLACE FUNCTION public.sign_participants(_register_id uuid, _participant_ids uuid[] DEFAULT NULL::uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF NOT public.register_has_started(_register_id) THEN
    RAISE EXCEPTION 'session_not_started';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.sign_libretti_group(_register_id uuid, _group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF NOT public.register_has_started(_register_id) THEN
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
$function$;

-- 7. Signature requests
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'signature_request';

CREATE TABLE IF NOT EXISTS public.dive_log_signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dive_log_id uuid NOT NULL REFERENCES public.dive_logs(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  instructor_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS dive_log_signature_requests_pending_uniq
  ON public.dive_log_signature_requests(dive_log_id, instructor_user_id)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE ON public.dive_log_signature_requests TO authenticated;
GRANT ALL ON public.dive_log_signature_requests TO service_role;

ALTER TABLE public.dive_log_signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester and instructor can view requests"
ON public.dive_log_signature_requests FOR SELECT TO authenticated
USING (requester_user_id = auth.uid() OR instructor_user_id = auth.uid());

CREATE POLICY "Log owner can create requests"
ON public.dive_log_signature_requests FOR INSERT TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.dive_logs l WHERE l.id = dive_log_id AND l.user_id = auth.uid())
);

CREATE POLICY "Instructor can update own requests"
ON public.dive_log_signature_requests FOR UPDATE TO authenticated
USING (instructor_user_id = auth.uid()) WITH CHECK (instructor_user_id = auth.uid());

CREATE TRIGGER update_dive_log_signature_requests_updated_at
BEFORE UPDATE ON public.dive_log_signature_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Instructors with a pending request can see the log they were asked to sign
CREATE OR REPLACE FUNCTION public.can_view_dive_log(_uid uuid, _log_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        OR EXISTS (
          SELECT 1 FROM public.dive_log_signature_requests sr
          WHERE sr.dive_log_id = l.id AND sr.instructor_user_id = _uid AND sr.status = 'pending'
        )
      )
  )
$function$;