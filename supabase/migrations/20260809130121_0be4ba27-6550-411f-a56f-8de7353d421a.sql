-- ============================================================
-- 20260730135537_651466f7-57bc-4aea-958a-a71be8b61fc4.sql
-- ============================================================
ALTER TABLE public.dive_registers ADD COLUMN IF NOT EXISTS center_label text;
ALTER TABLE public.dive_registers ADD COLUMN IF NOT EXISTS planned_depth_m numeric;

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

  -- No location -> no valid legal record
  IF NEW.spot_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, location, environment_type INTO _spot_name, _spot_loc, _spot_env
  FROM public.spots WHERE id = NEW.spot_id;

  -- Ordinary swimming-pool sessions are out of scope for Legge 70 registers
  IF _spot_env = 'pool' THEN
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
    (NEW.date_time AT TIME ZONE 'UTC')::date,
    (NEW.date_time AT TIME ZONE 'UTC')::time,
    'da_aprire',
    '{}'::jsonb,
    _group_name
  )
  RETURNING id INTO _new_reg_id;

  INSERT INTO public.dive_register_responsibles (register_id, instructor_user_id, is_school)
  VALUES (_new_reg_id, NEW.creator_id, COALESCE(_group_verified, false));

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.dive_register_participants_autolog()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _reg record;
  _log_id uuid;
  _owner uuid;
BEGIN
  IF NEW.dive_log_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, created_by, spot_id, spot_label, register_date, start_time, end_time,
         center_label, planned_depth_m
    INTO _reg
  FROM public.dive_registers
  WHERE id = NEW.register_id;

  IF _reg.id IS NULL THEN
    RAISE EXCEPTION 'register_not_found';
  END IF;

  _owner := COALESCE(NEW.user_id, _reg.created_by);

  INSERT INTO public.dive_logs (
    user_id, register_id, outing_type, discipline, spot_id, spot_label,
    dive_date, start_time, end_time, center_label, planned_depth_m, verification_status
  ) VALUES (
    _owner, _reg.id, 'guided', 'CWT', _reg.spot_id, _reg.spot_label,
    _reg.register_date, _reg.start_time, _reg.end_time, _reg.center_label,
    _reg.planned_depth_m, 'unverified'
  )
  RETURNING id INTO _log_id;

  NEW.dive_log_id := _log_id;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 20260730141544_dd631522-78c7-4ebf-8a49-30b5ca36b3c0.sql
-- ============================================================
-- 1) Allow completing outing data on a closed register (legal fields only)
CREATE OR REPLACE FUNCTION public.dive_registers_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'chiuso' THEN
    -- Once closed, only the Legge 70 outing fields can still be completed.
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.register_date IS DISTINCT FROM OLD.register_date
       OR NEW.spot_id IS DISTINCT FROM OLD.spot_id
       OR NEW.spot_label IS DISTINCT FROM OLD.spot_label
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.org_group_id IS DISTINCT FROM OLD.org_group_id
       OR NEW.session_id IS DISTINCT FROM OLD.session_id
       OR NEW.closed_at IS DISTINCT FROM OLD.closed_at
       OR NEW.retention_until IS DISTINCT FROM OLD.retention_until THEN
      RAISE EXCEPTION 'register_chiuso_immutable';
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
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
$function$;

-- 2) Guard on dive_logs: allow updating logs of a closed register as long as
--    they are not yet signed; keep blocking insert/delete.
CREATE OR REPLACE FUNCTION public.dive_logs_guard_closed_register()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    IF TG_OP = 'UPDATE'
       AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures s WHERE s.dive_log_id = OLD.id) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'register_chiuso_locked';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- 3) Propagate register outing/closure data down to the linked dive logs
CREATE OR REPLACE FUNCTION public.dive_registers_propagate_to_logs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _instructor text;
BEGIN
  SELECT COALESCE(NULLIF(TRIM(BOTH ' ' FROM CONCAT_WS(' ', pr.name, pr.last_name)), ''), NULL)
    INTO _instructor
  FROM public.dive_register_responsibles rr
  JOIN public.profiles pr ON pr.user_id = rr.instructor_user_id
  WHERE rr.register_id = NEW.id
  ORDER BY rr.created_at
  LIMIT 1;

  UPDATE public.dive_logs l
  SET start_time      = COALESCE(NEW.start_time, l.start_time),
      end_time        = COALESCE(NEW.end_time, l.end_time),
      planned_depth_m = COALESCE(NEW.planned_depth_m, l.planned_depth_m),
      center_label    = COALESCE(NEW.center_label, l.center_label),
      reached_depth_m = COALESCE(l.reached_depth_m, NEW.max_depth_m),
      instructor_label = COALESCE(l.instructor_label, _instructor),
      spot_label      = COALESCE(l.spot_label, NEW.spot_label),
      dive_date       = COALESCE(l.dive_date, NEW.register_date),
      updated_at      = now()
  FROM public.dive_register_participants p
  WHERE p.register_id = NEW.id
    AND l.id = p.dive_log_id
    AND l.verification_status <> 'verified'
    AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures s WHERE s.dive_log_id = l.id);

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_dive_registers_propagate ON public.dive_registers;
CREATE TRIGGER trg_dive_registers_propagate
AFTER UPDATE ON public.dive_registers
FOR EACH ROW
WHEN (
  OLD.start_time IS DISTINCT FROM NEW.start_time
  OR OLD.end_time IS DISTINCT FROM NEW.end_time
  OR OLD.planned_depth_m IS DISTINCT FROM NEW.planned_depth_m
  OR OLD.center_label IS DISTINCT FROM NEW.center_label
  OR OLD.max_depth_m IS DISTINCT FROM NEW.max_depth_m
  OR OLD.status IS DISTINCT FROM NEW.status
)
EXECUTE FUNCTION public.dive_registers_propagate_to_logs();

-- 4) Sync pending participants too (not only confirmed)
CREATE OR REPLACE FUNCTION public.sync_confirmed_to_register()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_register_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status IN ('pending','confirmed'))
     OR (TG_OP = 'UPDATE' AND NEW.status IN ('pending','confirmed')
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

-- 5) When a register is auto-created for a session, seed it with the organiser
--    and any already-existing pending/confirmed participants.
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

  SELECT name, location, environment_type INTO _spot_name, _spot_loc, _spot_env
  FROM public.spots WHERE id = NEW.spot_id;

  IF _spot_env = 'pool' THEN
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
    (NEW.date_time AT TIME ZONE 'UTC')::date,
    (NEW.date_time AT TIME ZONE 'UTC')::time,
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
    AND sp.status IN ('pending','confirmed')
    AND sp.user_id IS NOT NULL
  ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 6) Backfill: import pending/confirmed session participants into existing registers
INSERT INTO public.dive_register_participants (register_id, user_id)
SELECT r.id, sp.user_id
FROM public.dive_registers r
JOIN public.session_participants sp ON sp.session_id = r.session_id
WHERE r.session_id IS NOT NULL
  AND sp.status IN ('pending','confirmed')
  AND sp.user_id IS NOT NULL
ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;

-- 7) Backfill: push register outing data into unsigned dive logs
UPDATE public.dive_logs l
SET start_time      = COALESCE(r.start_time, l.start_time),
    end_time        = COALESCE(r.end_time, l.end_time),
    planned_depth_m = COALESCE(r.planned_depth_m, l.planned_depth_m),
    center_label    = COALESCE(r.center_label, l.center_label),
    reached_depth_m = COALESCE(l.reached_depth_m, r.max_depth_m),
    instructor_label = COALESCE(l.instructor_label, (
      SELECT NULLIF(TRIM(BOTH ' ' FROM CONCAT_WS(' ', pr.name, pr.last_name)), '')
      FROM public.dive_register_responsibles rr
      JOIN public.profiles pr ON pr.user_id = rr.instructor_user_id
      WHERE rr.register_id = r.id ORDER BY rr.created_at LIMIT 1
    )),
    spot_label      = COALESCE(l.spot_label, r.spot_label),
    updated_at      = now()
FROM public.dive_registers r
WHERE l.register_id = r.id
  AND l.verification_status <> 'verified'
  AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures s WHERE s.dive_log_id = l.id);

-- ============================================================
-- 20260730141706_2a60c230-aa84-40dd-88fc-f70e930c2cb9.sql
-- ============================================================
-- Helper: join first/last name without duplicating an already-complete name
CREATE OR REPLACE FUNCTION public.full_name_of(_name text, _last text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN COALESCE(_last, '') = '' THEN NULLIF(TRIM(COALESCE(_name, '')), '')
    WHEN LOWER(TRIM(COALESCE(_name, ''))) LIKE '%' || LOWER(TRIM(_last)) THEN NULLIF(TRIM(_name), '')
    ELSE NULLIF(TRIM(CONCAT_WS(' ', NULLIF(TRIM(COALESCE(_name, '')), ''), TRIM(_last))), '')
  END
$$;

-- Do not create a duplicate dive_log when the participant already exists
CREATE OR REPLACE FUNCTION public.dive_register_participants_autolog()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _reg record;
  _log_id uuid;
  _owner uuid;
BEGIN
  IF NEW.dive_log_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Same user already in this register: let the unique index reject the row
  -- without leaving an orphan dive_log behind.
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.dive_register_participants p
    WHERE p.register_id = NEW.register_id AND p.user_id = NEW.user_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT id, created_by, spot_id, spot_label, register_date, start_time, end_time,
         center_label, planned_depth_m, max_depth_m
    INTO _reg
  FROM public.dive_registers
  WHERE id = NEW.register_id;

  IF _reg.id IS NULL THEN
    RAISE EXCEPTION 'register_not_found';
  END IF;

  _owner := COALESCE(NEW.user_id, _reg.created_by);

  INSERT INTO public.dive_logs (
    user_id, register_id, outing_type, discipline, spot_id, spot_label,
    dive_date, start_time, end_time, center_label, planned_depth_m,
    reached_depth_m, instructor_label, verification_status
  ) VALUES (
    _owner, _reg.id, 'guided', 'CWT', _reg.spot_id, _reg.spot_label,
    _reg.register_date, _reg.start_time, _reg.end_time, _reg.center_label,
    _reg.planned_depth_m, _reg.max_depth_m,
    (SELECT public.full_name_of(pr.name, pr.last_name)
       FROM public.dive_register_responsibles rr
       JOIN public.profiles pr ON pr.user_id = rr.instructor_user_id
      WHERE rr.register_id = _reg.id
      ORDER BY rr.created_at LIMIT 1),
    'unverified'
  )
  RETURNING id INTO _log_id;

  NEW.dive_log_id := _log_id;
  RETURN NEW;
END;
$function$;

-- Use the safe name join when propagating register data
CREATE OR REPLACE FUNCTION public.dive_registers_propagate_to_logs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _instructor text;
BEGIN
  SELECT public.full_name_of(pr.name, pr.last_name)
    INTO _instructor
  FROM public.dive_register_responsibles rr
  JOIN public.profiles pr ON pr.user_id = rr.instructor_user_id
  WHERE rr.register_id = NEW.id
  ORDER BY rr.created_at
  LIMIT 1;

  UPDATE public.dive_logs l
  SET start_time      = COALESCE(NEW.start_time, l.start_time),
      end_time        = COALESCE(NEW.end_time, l.end_time),
      planned_depth_m = COALESCE(NEW.planned_depth_m, l.planned_depth_m),
      center_label    = COALESCE(NEW.center_label, l.center_label),
      reached_depth_m = COALESCE(l.reached_depth_m, NEW.max_depth_m),
      instructor_label = COALESCE(l.instructor_label, _instructor),
      spot_label      = COALESCE(l.spot_label, NEW.spot_label),
      dive_date       = COALESCE(l.dive_date, NEW.register_date),
      updated_at      = now()
  FROM public.dive_register_participants p
  WHERE p.register_id = NEW.id
    AND l.id = p.dive_log_id
    AND l.verification_status <> 'verified'
    AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures s WHERE s.dive_log_id = l.id);

  RETURN NEW;
END;
$function$;

-- Clean up orphaned logs left by the previous back-fill
ALTER TABLE public.dive_logs DISABLE TRIGGER USER;
DELETE FROM public.dive_logs l
WHERE l.register_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.dive_register_participants p WHERE p.dive_log_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures s WHERE s.dive_log_id = l.id);

-- Fix duplicated surnames already written into instructor_label
UPDATE public.dive_logs l
SET instructor_label = public.full_name_of(pr.name, pr.last_name)
FROM public.dive_register_responsibles rr
JOIN public.profiles pr ON pr.user_id = rr.instructor_user_id
WHERE rr.register_id = l.register_id
  AND l.instructor_label IS NOT NULL
  AND l.instructor_label IS DISTINCT FROM public.full_name_of(pr.name, pr.last_name);
ALTER TABLE public.dive_logs ENABLE TRIGGER USER;

-- ============================================================
-- 20260730144135_7bc4eacb-0b1d-4544-9be4-34e6d96a6f37.sql
-- ============================================================
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

  SELECT name, location, environment_type INTO _spot_name, _spot_loc, _spot_env
  FROM public.spots WHERE id = NEW.spot_id;

  IF _spot_env = 'pool' THEN
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
    AND sp.status IN ('pending','confirmed')
    AND sp.user_id IS NOT NULL
  ON CONFLICT (register_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

-- One-off correction of registers created from a session with the UTC-based times
UPDATE public.dive_registers r
SET register_date = (s.date_time AT TIME ZONE 'Europe/Rome')::date,
    start_time    = (s.date_time AT TIME ZONE 'Europe/Rome')::time,
    updated_at    = now()
FROM public.sessions s
WHERE r.session_id = s.id
  AND r.register_date = (s.date_time AT TIME ZONE 'UTC')::date
  AND r.start_time IS NOT DISTINCT FROM (s.date_time AT TIME ZONE 'UTC')::time
  AND (s.date_time AT TIME ZONE 'Europe/Rome')::time IS DISTINCT FROM (s.date_time AT TIME ZONE 'UTC')::time;

-- Re-sync linked, unsigned dive logs with the corrected values
UPDATE public.dive_logs l
SET dive_date  = r.register_date,
    start_time = r.start_time,
    updated_at = now()
FROM public.dive_register_participants p
JOIN public.dive_registers r ON r.id = p.register_id
WHERE l.id = p.dive_log_id
  AND l.verification_status <> 'verified'
  AND NOT EXISTS (SELECT 1 FROM public.dive_log_signatures sg WHERE sg.dive_log_id = l.id)
  AND (l.dive_date IS DISTINCT FROM r.register_date OR l.start_time IS DISTINCT FROM r.start_time);

-- ============================================================
-- 20260731144116_c7a06668-b3ad-47bd-bbf2-801369965798.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.dive_register_participants_autoassign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _resp_id uuid; _n int;
BEGIN
  IF NEW.assigned_responsible_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO _n FROM public.dive_register_responsibles WHERE register_id = NEW.register_id;
  IF _n = 1 THEN
    SELECT id INTO _resp_id FROM public.dive_register_responsibles WHERE register_id = NEW.register_id;
    NEW.assigned_responsible_id := _resp_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drp_autoassign ON public.dive_register_participants;
CREATE TRIGGER trg_drp_autoassign
BEFORE INSERT ON public.dive_register_participants
FOR EACH ROW EXECUTE FUNCTION public.dive_register_participants_autoassign();

-- When a register gets its first (single) responsible, adopt unassigned participants.
CREATE OR REPLACE FUNCTION public.dive_register_responsibles_autoassign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  SELECT count(*) INTO _n FROM public.dive_register_responsibles WHERE register_id = NEW.register_id;
  IF _n = 1 THEN
    UPDATE public.dive_register_participants
      SET assigned_responsible_id = NEW.id
      WHERE register_id = NEW.register_id AND assigned_responsible_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drr_autoassign ON public.dive_register_responsibles;
CREATE TRIGGER trg_drr_autoassign
AFTER INSERT ON public.dive_register_responsibles
FOR EACH ROW EXECUTE FUNCTION public.dive_register_responsibles_autoassign();

-- Backfill: existing registers with exactly one responsible
UPDATE public.dive_register_participants p
SET assigned_responsible_id = r.id
FROM public.dive_register_responsibles r
WHERE r.register_id = p.register_id
  AND p.assigned_responsible_id IS NULL
  AND (SELECT count(*) FROM public.dive_register_responsibles x WHERE x.register_id = p.register_id) = 1;