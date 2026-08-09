CREATE OR REPLACE FUNCTION public.request_log_signature(_log_id uuid, _instructor_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _req_id uuid;
  _owner_name text;
  _log record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT id, user_id, dive_date, spot_label, verification_status INTO _log
  FROM public.dive_logs WHERE id = _log_id;
  IF _log.id IS NULL THEN RAISE EXCEPTION 'log_not_found'; END IF;
  IF _log.user_id <> _uid THEN RAISE EXCEPTION 'not_owner'; END IF;
  IF _log.verification_status = 'verified' THEN RAISE EXCEPTION 'already_signed'; END IF;

  IF NOT (public.has_role(_instructor_user_id, 'instructor') OR public.has_role(_instructor_user_id, 'admin')) THEN
    RAISE EXCEPTION 'not_instructor';
  END IF;

  INSERT INTO public.dive_log_signature_requests (dive_log_id, requester_user_id, instructor_user_id)
  VALUES (_log_id, _uid, _instructor_user_id)
  ON CONFLICT (dive_log_id, instructor_user_id) WHERE status = 'pending' DO NOTHING
  RETURNING id INTO _req_id;

  IF _req_id IS NULL THEN
    SELECT id INTO _req_id FROM public.dive_log_signature_requests
    WHERE dive_log_id = _log_id AND instructor_user_id = _instructor_user_id AND status = 'pending';
    RETURN _req_id;
  END IF;

  SELECT public.full_name_of(p.name, p.last_name) INTO _owner_name
  FROM public.profiles p WHERE p.user_id = _uid;

  UPDATE public.dive_logs SET updated_at = now() WHERE id = _log_id AND false;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    _instructor_user_id,
    'signature_request',
    'Richiesta di firma libretto',
    COALESCE(_owner_name, 'Un utente') || ' chiede la firma di un''immersione del ' || to_char(_log.dive_date, 'DD/MM/YYYY'),
    jsonb_build_object('dive_log_id', _log_id, 'request_id', _req_id, 'requester_id', _uid)
  );

  UPDATE public.dive_log_signatures SET requested_at = now() WHERE dive_log_id = _log_id AND requested_at IS NULL;

  RETURN _req_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sign_requested_log(_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _brevetto text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dive_log_signature_requests
    WHERE dive_log_id = _log_id AND instructor_user_id = _uid AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'no_pending_request';
  END IF;

  IF EXISTS (SELECT 1 FROM public.dive_log_signatures WHERE dive_log_id = _log_id) THEN
    RAISE EXCEPTION 'already_signed';
  END IF;

  SELECT instructor_brevetto_label INTO _brevetto FROM public.profiles WHERE user_id = _uid;

  INSERT INTO public.dive_log_signatures (dive_log_id, verifier_user_id, verifier_brevetto_label, method, credential_confirmed_at)
  VALUES (_log_id, _uid, _brevetto, 'credential', now());

  UPDATE public.dive_logs SET verification_status = 'verified', updated_at = now() WHERE id = _log_id;

  UPDATE public.dive_log_signature_requests
  SET status = 'signed', updated_at = now()
  WHERE dive_log_id = _log_id AND instructor_user_id = _uid AND status = 'pending';

  RETURN true;
END;
$function$;

-- ============================================================
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_session_type_check
  CHECK (session_type = ANY (ARRAY['sea_trip'::text, 'pool_session'::text, 'deep_pool_session'::text, 'lake_trip'::text, 'training'::text, 'spearfishing'::text]));

-- ============================================================
-- 1. Default status for new registers
ALTER TABLE public.dive_registers ALTER COLUMN status SET DEFAULT 'aperto';

-- 2. Session-driven register creation: create already open
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
    register_date, start_time, status, opened_at, safety_checklist, center_label
  ) VALUES (
    NEW.creator_id,
    NEW.id,
    CASE WHEN COALESCE(_group_verified, false) THEN NEW.group_id ELSE NULL END,
    NEW.title,
    NEW.spot_id,
    _spot_label,
    (NEW.date_time AT TIME ZONE 'Europe/Rome')::date,
    (NEW.date_time AT TIME ZONE 'Europe/Rome')::time,
    'aperto',
    NEW.date_time,
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

-- 3. Event-driven register creation: create already open
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
    register_date, status, opened_at, safety_checklist, center_label
  ) VALUES (
    NEW.creator_id,
    NEW.id,
    CASE WHEN COALESCE(_group_verified, false) THEN NEW.group_id ELSE NULL END,
    NEW.title,
    NEW.location,
    NEW.start_date,
    'aperto',
    now(),
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

-- 4. Backfill: no register stays in 'da_aprire'
UPDATE public.dive_registers
SET status = 'aperto',
    opened_at = COALESCE(
      opened_at,
      CASE
        WHEN start_time IS NOT NULL
          THEN ((register_date + start_time) AT TIME ZONE 'Europe/Rome')
        ELSE created_at
      END
    )
WHERE status = 'da_aprire';