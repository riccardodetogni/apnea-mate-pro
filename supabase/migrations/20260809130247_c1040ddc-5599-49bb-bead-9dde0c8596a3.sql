CREATE OR REPLACE FUNCTION public.brevetto_label_of(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(TRIM(p.instructor_brevetto_label), '')
       FROM public.profiles p WHERE p.user_id = _user_id),
    (SELECT NULLIF(TRIM(c.agency), '')
            || COALESCE(' · ' || NULLIF(TRIM(c.level), ''), '')
            || COALESCE(' · n. ' || NULLIF(TRIM(c.certification_id), ''), '')
       FROM public.certifications c
      WHERE c.user_id = _user_id AND c.status = 'approved'
      ORDER BY c.reviewed_at DESC NULLS LAST, c.updated_at DESC
      LIMIT 1)
  )
$$;

CREATE OR REPLACE FUNCTION public.dive_register_fill_brevetto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.brevetto_label IS NULL OR TRIM(NEW.brevetto_label) = '' THEN
    IF TG_TABLE_NAME = 'dive_register_responsibles' THEN
      NEW.brevetto_label := public.brevetto_label_of(NEW.instructor_user_id);
    ELSIF NEW.user_id IS NOT NULL THEN
      NEW.brevetto_label := public.brevetto_label_of(NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drp_fill_brevetto ON public.dive_register_participants;
CREATE TRIGGER trg_drp_fill_brevetto
BEFORE INSERT ON public.dive_register_participants
FOR EACH ROW EXECUTE FUNCTION public.dive_register_fill_brevetto();

DROP TRIGGER IF EXISTS trg_drr_fill_brevetto ON public.dive_register_responsibles;
CREATE TRIGGER trg_drr_fill_brevetto
BEFORE INSERT ON public.dive_register_responsibles
FOR EACH ROW EXECUTE FUNCTION public.dive_register_fill_brevetto();

UPDATE public.dive_register_participants p
   SET brevetto_label = public.brevetto_label_of(p.user_id)
 WHERE (p.brevetto_label IS NULL OR TRIM(p.brevetto_label) = '')
   AND p.user_id IS NOT NULL
   AND public.brevetto_label_of(p.user_id) IS NOT NULL;

UPDATE public.dive_register_responsibles r
   SET brevetto_label = public.brevetto_label_of(r.instructor_user_id)
 WHERE (r.brevetto_label IS NULL OR TRIM(r.brevetto_label) = '')
   AND public.brevetto_label_of(r.instructor_user_id) IS NOT NULL;