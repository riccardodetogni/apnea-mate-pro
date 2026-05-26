
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name, last_name, birth_date, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
    CASE
      WHEN NULLIF(NEW.raw_user_meta_data ->> 'birth_date', '') IS NOT NULL
      THEN (NEW.raw_user_meta_data ->> 'birth_date')::date
      ELSE NULL
    END,
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'regular');

  RETURN NEW;
END;
$function$;
