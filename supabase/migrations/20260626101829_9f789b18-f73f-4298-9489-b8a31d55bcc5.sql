
ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE public.course_participants
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;

ALTER TABLE public.session_participants DROP CONSTRAINT IF EXISTS session_participants_status_check;
ALTER TABLE public.session_participants
  ADD CONSTRAINT session_participants_status_check
  CHECK (status IN ('pending','confirmed','cancelled'));

ALTER TABLE public.event_participants DROP CONSTRAINT IF EXISTS event_participants_status_check;
ALTER TABLE public.event_participants
  ADD CONSTRAINT event_participants_status_check
  CHECK (status IN ('pending','confirmed','cancelled'));

ALTER TABLE public.course_participants DROP CONSTRAINT IF EXISTS course_participants_status_check;
ALTER TABLE public.course_participants
  ADD CONSTRAINT course_participants_status_check
  CHECK (status IN ('pending','confirmed','cancelled'));

CREATE OR REPLACE FUNCTION public.enforce_session_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE max_p int; current_count int;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT s.max_participants INTO max_p FROM public.sessions s WHERE s.id = NEW.session_id;
  IF max_p IS NULL THEN RAISE EXCEPTION 'session_not_found'; END IF;

  SELECT count(*) INTO current_count FROM public.session_participants sp
  WHERE sp.session_id = NEW.session_id AND sp.status IN ('pending','confirmed') AND sp.id <> NEW.id;

  IF current_count >= max_p THEN RAISE EXCEPTION 'session_full'; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE max_p int; current_count int;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT e.max_participants INTO max_p FROM public.events e WHERE e.id = NEW.event_id;
  IF max_p IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;
  IF max_p = 0 THEN RETURN NEW; END IF;

  SELECT count(*) INTO current_count FROM public.event_participants ep
  WHERE ep.event_id = NEW.event_id AND ep.status IN ('pending','confirmed') AND ep.id <> NEW.id;

  IF current_count >= max_p THEN RAISE EXCEPTION 'event_full'; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_course_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE max_p int; current_count int;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT c.max_participants INTO max_p FROM public.courses c WHERE c.id = NEW.course_id;
  IF max_p IS NULL THEN RAISE EXCEPTION 'course_not_found'; END IF;
  IF max_p = 0 THEN RETURN NEW; END IF;

  SELECT count(*) INTO current_count FROM public.course_participants cp
  WHERE cp.course_id = NEW.course_id AND cp.status IN ('pending','confirmed') AND cp.id <> NEW.id;

  IF current_count >= max_p THEN RAISE EXCEPTION 'course_full'; END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_session_capacity_trigger ON public.session_participants;
DROP TRIGGER IF EXISTS trg_enforce_session_capacity ON public.session_participants;
CREATE TRIGGER trg_enforce_session_capacity
  BEFORE INSERT OR UPDATE OF status ON public.session_participants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_capacity();

DROP TRIGGER IF EXISTS enforce_event_capacity_trigger ON public.event_participants;
DROP TRIGGER IF EXISTS trg_enforce_event_capacity ON public.event_participants;
CREATE TRIGGER trg_enforce_event_capacity
  BEFORE INSERT OR UPDATE OF status ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_event_capacity();

DROP TRIGGER IF EXISTS enforce_course_capacity_trigger ON public.course_participants;
DROP TRIGGER IF EXISTS trg_enforce_course_capacity ON public.course_participants;
CREATE TRIGGER trg_enforce_course_capacity
  BEFORE INSERT OR UPDATE OF status ON public.course_participants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_course_capacity();

DROP POLICY IF EXISTS "Users can cancel own session participation" ON public.session_participants;
CREATE POLICY "Users can cancel own session participation"
  ON public.session_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

DROP POLICY IF EXISTS "Users can cancel own event participation" ON public.event_participants;
CREATE POLICY "Users can cancel own event participation"
  ON public.event_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

DROP POLICY IF EXISTS "Users can cancel own course participation" ON public.course_participants;
CREATE POLICY "Users can cancel own course participation"
  ON public.course_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE OR REPLACE FUNCTION public.rejoin_session(_session_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid(); _row_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  INSERT INTO public.session_participants (session_id, user_id, status, joined_at, cancelled_at, cancelled_by)
  VALUES (_session_id, _uid, 'pending', now(), NULL, NULL)
  ON CONFLICT (session_id, user_id) DO UPDATE SET
    status = 'pending', joined_at = now(), cancelled_at = NULL, cancelled_by = NULL
  WHERE public.session_participants.status = 'cancelled'
  RETURNING id INTO _row_id;
  IF _row_id IS NULL THEN
    SELECT id INTO _row_id FROM public.session_participants
    WHERE session_id = _session_id AND user_id = _uid;
  END IF;
  RETURN _row_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rejoin_event(_event_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid(); _row_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  INSERT INTO public.event_participants (event_id, user_id, status, joined_at, cancelled_at, cancelled_by)
  VALUES (_event_id, _uid, 'pending', now(), NULL, NULL)
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    status = 'pending', joined_at = now(), cancelled_at = NULL, cancelled_by = NULL
  WHERE public.event_participants.status = 'cancelled'
  RETURNING id INTO _row_id;
  IF _row_id IS NULL THEN
    SELECT id INTO _row_id FROM public.event_participants
    WHERE event_id = _event_id AND user_id = _uid;
  END IF;
  RETURN _row_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rejoin_course(_course_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid(); _row_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  INSERT INTO public.course_participants (course_id, user_id, status, joined_at, cancelled_at, cancelled_by)
  VALUES (_course_id, _uid, 'pending', now(), NULL, NULL)
  ON CONFLICT (course_id, user_id) DO UPDATE SET
    status = 'pending', joined_at = now(), cancelled_at = NULL, cancelled_by = NULL
  WHERE public.course_participants.status = 'cancelled'
  RETURNING id INTO _row_id;
  IF _row_id IS NULL THEN
    SELECT id INTO _row_id FROM public.course_participants
    WHERE course_id = _course_id AND user_id = _uid;
  END IF;
  RETURN _row_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rejoin_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejoin_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejoin_course(uuid) TO authenticated;
