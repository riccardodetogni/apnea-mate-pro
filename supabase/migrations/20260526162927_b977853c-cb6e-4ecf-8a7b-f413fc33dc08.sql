
-- New notification enum values
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_cancelled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'course_cancelled';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'group_deleted';

-- =========================
-- delete_session_cascade
-- =========================
CREATE OR REPLACE FUNCTION public.delete_session_cascade(_session_id uuid)
RETURNS TABLE(user_id uuid, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid;
  _title text;
BEGIN
  SELECT s.creator_id, s.title INTO _creator, _title
  FROM public.sessions s WHERE s.id = _session_id;

  IF _creator IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _creator THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  RETURN QUERY
    SELECT sp.user_id, _title
    FROM public.session_participants sp
    WHERE sp.session_id = _session_id
      AND sp.status IN ('pending', 'confirmed')
      AND sp.user_id <> _creator;

  DELETE FROM public.session_participants WHERE session_id = _session_id;
  DELETE FROM public.sessions WHERE id = _session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_session_cascade(uuid) TO authenticated;

-- =========================
-- delete_event_cascade
-- =========================
CREATE OR REPLACE FUNCTION public.delete_event_cascade(_event_id uuid)
RETURNS TABLE(user_id uuid, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid;
  _title text;
BEGIN
  SELECT e.creator_id, e.title INTO _creator, _title
  FROM public.events e WHERE e.id = _event_id;

  IF _creator IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _creator THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  RETURN QUERY
    SELECT ep.user_id, _title
    FROM public.event_participants ep
    WHERE ep.event_id = _event_id
      AND ep.status IN ('pending', 'confirmed')
      AND ep.user_id <> _creator;

  DELETE FROM public.event_schedule WHERE event_id = _event_id;
  DELETE FROM public.event_participants WHERE event_id = _event_id;
  DELETE FROM public.events WHERE id = _event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_event_cascade(uuid) TO authenticated;

-- =========================
-- delete_course_cascade
-- =========================
CREATE OR REPLACE FUNCTION public.delete_course_cascade(_course_id uuid)
RETURNS TABLE(user_id uuid, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid;
  _title text;
BEGIN
  SELECT c.creator_id, c.title INTO _creator, _title
  FROM public.courses c WHERE c.id = _course_id;

  IF _creator IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _creator THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  RETURN QUERY
    SELECT cp.user_id, _title
    FROM public.course_participants cp
    WHERE cp.course_id = _course_id
      AND cp.status IN ('pending', 'confirmed')
      AND cp.user_id <> _creator;

  DELETE FROM public.course_participants WHERE course_id = _course_id;
  DELETE FROM public.courses WHERE id = _course_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_course_cascade(uuid) TO authenticated;

-- =========================
-- delete_group_cascade
-- =========================
CREATE OR REPLACE FUNCTION public.delete_group_cascade(_group_id uuid)
RETURNS TABLE(user_id uuid, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _name text;
BEGIN
  SELECT g.created_by, g.name INTO _owner, _name
  FROM public.groups g WHERE g.id = _group_id;

  IF _owner IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _owner THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  RETURN QUERY
    SELECT DISTINCT gm.user_id, _name
    FROM public.group_members gm
    WHERE gm.group_id = _group_id
      AND gm.user_id <> _owner;

  -- Detach sessions/courses/events instead of deleting
  UPDATE public.sessions SET group_id = NULL WHERE group_id = _group_id;
  UPDATE public.courses  SET group_id = NULL WHERE group_id = _group_id;
  UPDATE public.events   SET group_id = NULL WHERE group_id = _group_id;

  DELETE FROM public.group_tags WHERE group_id = _group_id;
  DELETE FROM public.group_members WHERE group_id = _group_id;
  DELETE FROM public.groups WHERE id = _group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_group_cascade(uuid) TO authenticated;
