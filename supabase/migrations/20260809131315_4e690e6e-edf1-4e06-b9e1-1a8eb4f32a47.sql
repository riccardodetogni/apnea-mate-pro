-- 1) Notify the diver when their dive log gets signed
CREATE OR REPLACE FUNCTION public.notify_dive_log_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _date date;
  _register uuid;
  _verifier text;
BEGIN
  SELECT user_id, dive_date, register_id INTO _owner, _date, _register
  FROM public.dive_logs WHERE id = NEW.dive_log_id;

  IF _owner IS NULL OR _owner = NEW.verifier_user_id THEN
    RETURN NEW;
  END IF;

  SELECT public.full_name_of(p.name, p.last_name) INTO _verifier
  FROM public.profiles p WHERE p.user_id = NEW.verifier_user_id;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    _owner,
    'dive_log_signed',
    'Immersione firmata',
    COALESCE(_verifier, 'Un istruttore') || ' ha firmato la tua immersione del ' || to_char(_date, 'DD/MM/YYYY'),
    jsonb_build_object('dive_log_id', NEW.dive_log_id, 'register_id', _register, 'verifier_id', NEW.verifier_user_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_dive_log_signed ON public.dive_log_signatures;
CREATE TRIGGER trg_notify_dive_log_signed
AFTER INSERT ON public.dive_log_signatures
FOR EACH ROW EXECUTE FUNCTION public.notify_dive_log_signed();

-- 2) Notify present participants when a register is closed
CREATE OR REPLACE FUNCTION public.notify_register_closed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _p record;
  _actor uuid := auth.uid();
BEGIN
  IF NEW.status <> 'chiuso' OR COALESCE(OLD.status, '') = 'chiuso' THEN
    RETURN NEW;
  END IF;

  FOR _p IN
    SELECT DISTINCT rp.user_id, rp.dive_log_id
    FROM public.dive_register_participants rp
    WHERE rp.register_id = NEW.id
      AND rp.user_id IS NOT NULL
      AND rp.attendance_status = 'present'
  LOOP
    IF _actor IS NOT NULL AND _p.user_id = _actor THEN
      CONTINUE;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      _p.user_id,
      'register_closed',
      'Registro chiuso',
      'Il registro "' || NEW.title || '" del ' || to_char(NEW.register_date, 'DD/MM/YYYY') || ' è stato chiuso: la tua immersione è definitiva.',
      jsonb_build_object('register_id', NEW.id, 'dive_log_id', _p.dive_log_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_register_closed ON public.dive_registers;
CREATE TRIGGER trg_notify_register_closed
AFTER UPDATE OF status ON public.dive_registers
FOR EACH ROW EXECUTE FUNCTION public.notify_register_closed();

-- 3) Notify the diver when a dive log is auto-created for them
CREATE OR REPLACE FUNCTION public.notify_dive_log_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
BEGIN
  IF NEW.register_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF _actor IS NOT NULL AND NEW.user_id = _actor THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'dive_log_created',
    'Nuova immersione nel libretto',
    'È stata creata una voce nel tuo libretto per il ' || to_char(NEW.dive_date, 'DD/MM/YYYY') || ': completala con profondità, orari e note.',
    jsonb_build_object('dive_log_id', NEW.id, 'register_id', NEW.register_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_dive_log_created ON public.dive_logs;
CREATE TRIGGER trg_notify_dive_log_created
AFTER INSERT ON public.dive_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_dive_log_created();