-- ============================================================
-- 20260717103725_79b16504-d240-433e-8cf6-860af586510d.sql
-- ============================================================

-- 1. Safety checklist on dive_registers
ALTER TABLE public.dive_registers
  ADD COLUMN IF NOT EXISTS safety_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Add 'signature_reminder' to notification_type enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'signature_reminder'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'signature_reminder';
  END IF;
END $$;

-- 3. Trigger: auto-create linked dive_log on participant INSERT
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
    user_id, register_id, outing_type, spot_id, spot_label,
    dive_date, verification_status
  ) VALUES (
    _owner, _reg.id, 'guided', _reg.spot_id, _reg.spot_label,
    _reg.register_date, 'unverified'
  )
  RETURNING id INTO _log_id;

  NEW.dive_log_id := _log_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drp_autolog_ins ON public.dive_register_participants;
CREATE TRIGGER trg_drp_autolog_ins
  BEFORE INSERT ON public.dive_register_participants
  FOR EACH ROW EXECUTE FUNCTION public.dive_register_participants_autolog();

-- 4. Trigger: cascade-delete linked dive_log when participant removed (if register not chiuso)
CREATE OR REPLACE FUNCTION public.dive_register_participants_autolog_del()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _status text;
BEGIN
  IF OLD.dive_log_id IS NULL THEN
    RETURN OLD;
  END IF;
  SELECT status INTO _status FROM public.dive_registers WHERE id = OLD.register_id;
  IF _status = 'chiuso' THEN
    RETURN OLD;
  END IF;
  DELETE FROM public.dive_logs WHERE id = OLD.dive_log_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_drp_autolog_del ON public.dive_register_participants;
CREATE TRIGGER trg_drp_autolog_del
  AFTER DELETE ON public.dive_register_participants
  FOR EACH ROW EXECUTE FUNCTION public.dive_register_participants_autolog_del();
