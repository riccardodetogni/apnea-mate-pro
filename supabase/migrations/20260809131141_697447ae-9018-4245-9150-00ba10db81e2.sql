CREATE OR REPLACE FUNCTION public.dive_log_origin(_log_id uuid)
RETURNS TABLE(kind text, ref_id uuid, title text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_view_dive_log(auth.uid(), _log_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 'session'::text, s.id, s.title
  FROM public.dive_logs l
  JOIN public.dive_registers r ON r.id = l.register_id
  JOIN public.sessions s ON s.id = r.session_id
  WHERE l.id = _log_id
  UNION ALL
  SELECT 'event'::text, e.id, e.title
  FROM public.dive_logs l
  JOIN public.dive_registers r ON r.id = l.register_id
  JOIN public.events e ON e.id = r.event_id
  WHERE l.id = _log_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.dive_log_origin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dive_log_origin(uuid) TO authenticated;

-- ============================================================
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
  IF _instructor_user_id = _uid THEN RAISE EXCEPTION 'self_request'; END IF;

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
  _owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT user_id INTO _owner FROM public.dive_logs WHERE id = _log_id;
  IF _owner IS NULL THEN RAISE EXCEPTION 'log_not_found'; END IF;
  IF _owner = _uid THEN RAISE EXCEPTION 'self_sign'; END IF;

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

CREATE OR REPLACE FUNCTION public.search_instructors(_q text)
 RETURNS TABLE(user_id uuid, name text, last_name text, instructor_brevetto_label text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.user_id, p.name, p.last_name, public.brevetto_label_of(p.user_id)
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND length(TRIM(COALESCE(_q, ''))) >= 2
    AND (public.has_role(p.user_id, 'instructor') OR public.has_role(p.user_id, 'admin'))
    AND (
      p.name ILIKE '%' || TRIM(_q) || '%'
      OR p.last_name ILIKE '%' || TRIM(_q) || '%'
      OR public.full_name_of(p.name, p.last_name) ILIKE '%' || TRIM(_q) || '%'
    )
  ORDER BY p.name
  LIMIT 8
$function$;

-- ============================================================
CREATE OR REPLACE FUNCTION public.dive_logs_guard_attribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
    IF NEW.instructor_label IS DISTINCT FROM OLD.instructor_label
       OR NEW.center_label IS DISTINCT FROM OLD.center_label THEN
      RAISE EXCEPTION 'attribution_locked: instructor and centre cannot be edited by the log owner'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dive_logs_guard_attribution_trg ON public.dive_logs;
CREATE TRIGGER dive_logs_guard_attribution_trg
BEFORE UPDATE ON public.dive_logs
FOR EACH ROW EXECUTE FUNCTION public.dive_logs_guard_attribution();

-- ============================================================
CREATE OR REPLACE FUNCTION public.dive_logs_guard_attribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.user_id
     AND (NEW.instructor_label IS DISTINCT FROM OLD.instructor_label
          OR NEW.center_label IS DISTINCT FROM OLD.center_label) THEN
    IF OLD.register_id IS NULL
       OR NOT public.is_dive_register_manager(auth.uid(), OLD.register_id) THEN
      RAISE EXCEPTION 'attribution_locked: instructor and centre cannot be edited by the log owner'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;