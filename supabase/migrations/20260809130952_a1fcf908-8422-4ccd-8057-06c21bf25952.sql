CREATE OR REPLACE FUNCTION public.search_instructors(_q text)
RETURNS TABLE(user_id uuid, name text, last_name text, instructor_brevetto_label text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.last_name, public.brevetto_label_of(p.user_id)
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND length(TRIM(COALESCE(_q, ''))) >= 2
    AND (public.has_role(p.user_id, 'instructor') OR public.has_role(p.user_id, 'admin'))
    AND (
      p.name ILIKE '%' || TRIM(_q) || '%'
      OR p.last_name ILIKE '%' || TRIM(_q) || '%'
      OR public.full_name_of(p.name, p.last_name) ILIKE '%' || TRIM(_q) || '%'
    )
  ORDER BY p.name
  LIMIT 8
$$;

REVOKE ALL ON FUNCTION public.search_instructors(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_instructors(text) TO authenticated;

-- ============================================================
CREATE OR REPLACE FUNCTION public.event_schedule_sync_register_start()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.day_number = 1 AND NEW.start_time IS NOT NULL THEN
    UPDATE public.dive_registers r
    SET start_time = NEW.start_time, updated_at = now()
    WHERE r.event_id = NEW.event_id
      AND r.start_time IS NULL
      AND r.status <> 'chiuso';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_schedule_sync_register_start ON public.event_schedule;
CREATE TRIGGER trg_event_schedule_sync_register_start
AFTER INSERT OR UPDATE ON public.event_schedule
FOR EACH ROW EXECUTE FUNCTION public.event_schedule_sync_register_start();

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
  _start_time time;
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

  SELECT s.start_time INTO _start_time
  FROM public.event_schedule s
  WHERE s.event_id = NEW.id AND s.day_number = 1 AND s.start_time IS NOT NULL
  LIMIT 1;

  INSERT INTO public.dive_registers (
    created_by, event_id, org_group_id, title, spot_label,
    register_date, start_time, status, opened_at, safety_checklist, center_label
  ) VALUES (
    NEW.creator_id,
    NEW.id,
    CASE WHEN COALESCE(_group_verified, false) THEN NEW.group_id ELSE NULL END,
    NEW.title,
    NEW.location,
    NEW.start_date,
    _start_time,
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

-- ============================================================
-- 1. event_id FK: CASCADE -> SET NULL (preserve register / Legge 70 retention)
ALTER TABLE public.dive_registers DROP CONSTRAINT IF EXISTS dive_registers_event_id_fkey;
ALTER TABLE public.dive_registers
  ADD CONSTRAINT dive_registers_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

-- 2. Sync session edits into its open register
CREATE OR REPLACE FUNCTION public.sync_session_to_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _spot_name text;
  _spot_loc text;
  _spot_label text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.dive_registers WHERE session_id = NEW.id AND status <> 'chiuso') THEN
    RETURN NEW;
  END IF;

  IF NEW.spot_id IS NOT NULL THEN
    SELECT name, location INTO _spot_name, _spot_loc FROM public.spots WHERE id = NEW.spot_id;
    IF _spot_name IS NOT NULL THEN
      _spot_label := _spot_name || COALESCE(' · ' || _spot_loc, '');
    END IF;
  END IF;

  UPDATE public.dive_registers
  SET title         = NEW.title,
      spot_id       = NEW.spot_id,
      spot_label    = COALESCE(_spot_label, spot_label),
      register_date = (NEW.date_time AT TIME ZONE 'Europe/Rome')::date,
      start_time    = (NEW.date_time AT TIME ZONE 'Europe/Rome')::time,
      opened_at     = COALESCE(opened_at, NEW.date_time),
      updated_at    = now()
  WHERE session_id = NEW.id AND status <> 'chiuso';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_session_to_register ON public.sessions;
CREATE TRIGGER trg_sync_session_to_register
AFTER UPDATE OF date_time, spot_id, title ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.sync_session_to_register();

-- 3. Sync event edits into its open register
CREATE OR REPLACE FUNCTION public.sync_event_to_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.dive_registers WHERE event_id = NEW.id AND status <> 'chiuso') THEN
    RETURN NEW;
  END IF;

  UPDATE public.dive_registers
  SET title         = NEW.title,
      spot_label    = COALESCE(NEW.location, spot_label),
      register_date = NEW.start_date,
      updated_at    = now()
  WHERE event_id = NEW.id AND status <> 'chiuso';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_event_to_register ON public.events;
CREATE TRIGGER trg_sync_event_to_register
AFTER UPDATE OF start_date, location, title ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_to_register();

-- 4. Sync day-1 schedule time into the event's open register
CREATE OR REPLACE FUNCTION public.sync_event_schedule_to_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _start time;
BEGIN
  _event_id := COALESCE(NEW.event_id, OLD.event_id);

  SELECT es.start_time INTO _start
  FROM public.event_schedule es
  WHERE es.event_id = _event_id AND es.day_number = 1 AND es.start_time IS NOT NULL
  ORDER BY es.start_time
  LIMIT 1;

  IF _start IS NOT NULL THEN
    UPDATE public.dive_registers
    SET start_time = _start, updated_at = now()
    WHERE event_id = _event_id AND status <> 'chiuso';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_event_schedule_to_register ON public.event_schedule;
CREATE TRIGGER trg_sync_event_schedule_to_register
AFTER INSERT OR UPDATE OR DELETE ON public.event_schedule
FOR EACH ROW EXECUTE FUNCTION public.sync_event_schedule_to_register();

-- 5. When a group becomes verified, attribute its open registers to the school
CREATE OR REPLACE FUNCTION public.sync_group_verified_to_registers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verified IS NOT TRUE OR OLD.verified IS TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.dive_registers r
  SET org_group_id = NEW.id,
      center_label = COALESCE(r.center_label, NEW.name),
      updated_at   = now()
  WHERE r.status <> 'chiuso'
    AND r.org_group_id IS NULL
    AND (
      EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = r.session_id AND s.group_id = NEW.id)
      OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = r.event_id AND e.group_id = NEW.id)
    );

  UPDATE public.dive_register_responsibles rr
  SET is_school = true
  WHERE rr.register_id IN (SELECT id FROM public.dive_registers WHERE org_group_id = NEW.id AND status <> 'chiuso');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_group_verified_to_registers ON public.groups;
CREATE TRIGGER trg_sync_group_verified_to_registers
AFTER UPDATE OF verified ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.sync_group_verified_to_registers();

-- 6. Cleanup: orphan generated dive_logs (no register, no participant link, unsigned)
DELETE FROM public.dive_logs l
WHERE l.register_id IS NULL
  AND l.outing_type = 'guided'
  AND NOT EXISTS (SELECT 1 FROM public.dive_register_participants p WHERE p.dive_log_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures s WHERE s.dive_log_id = l.id);

-- 7. Backfill missing start_time on event registers from day-1 schedule
UPDATE public.dive_registers r
SET start_time = es.start_time
FROM public.event_schedule es
WHERE r.event_id = es.event_id
  AND es.day_number = 1
  AND es.start_time IS NOT NULL
  AND r.start_time IS NULL
  AND r.status <> 'chiuso';