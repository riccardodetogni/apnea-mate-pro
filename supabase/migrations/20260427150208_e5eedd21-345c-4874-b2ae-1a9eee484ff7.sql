
-- Capacity enforcement for events
CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_p int;
  current_count int;
BEGIN
  SELECT e.max_participants INTO max_p
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF max_p IS NULL THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  -- 0 means unlimited
  IF max_p = 0 THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO current_count
  FROM public.event_participants ep
  WHERE ep.event_id = NEW.event_id
    AND ep.status IN ('pending', 'confirmed');

  IF current_count >= max_p THEN
    RAISE EXCEPTION 'event_full';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_event_capacity ON public.event_participants;
CREATE TRIGGER trg_enforce_event_capacity
BEFORE INSERT ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_event_capacity();

-- Capacity enforcement for courses
CREATE OR REPLACE FUNCTION public.enforce_course_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_p int;
  current_count int;
BEGIN
  SELECT c.max_participants INTO max_p
  FROM public.courses c
  WHERE c.id = NEW.course_id;

  IF max_p IS NULL THEN
    RAISE EXCEPTION 'course_not_found';
  END IF;

  IF max_p = 0 THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO current_count
  FROM public.course_participants cp
  WHERE cp.course_id = NEW.course_id
    AND cp.status IN ('pending', 'confirmed');

  IF current_count >= max_p THEN
    RAISE EXCEPTION 'course_full';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_course_capacity ON public.course_participants;
CREATE TRIGGER trg_enforce_course_capacity
BEFORE INSERT ON public.course_participants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_course_capacity();
