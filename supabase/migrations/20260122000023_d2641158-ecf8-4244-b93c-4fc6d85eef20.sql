-- Session join approval workflow + hosting permissions

-- 1) Require join requests to start as pending
ALTER TABLE public.session_participants
  ALTER COLUMN status SET DEFAULT 'pending';

-- 2) Update RLS on session_participants to prevent self-confirmation
DO $$
BEGIN
  -- Drop overly-permissive policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='session_participants' AND policyname='Users can join sessions'
  ) THEN
    EXECUTE 'DROP POLICY "Users can join sessions" ON public.session_participants';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='session_participants' AND policyname='Users can update own participation'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update own participation" ON public.session_participants';
  END IF;
END $$;

-- Users can create a join request ONLY as pending for themselves
CREATE POLICY "Users can request to join sessions"
ON public.session_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

-- Session creators (and admins) can approve/reject participants
CREATE POLICY "Session creators can manage participant status"
ON public.session_participants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND s.creator_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3) Enforce capacity at the database level (prevents race conditions)
CREATE OR REPLACE FUNCTION public.enforce_session_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_p int;
  current_count int;
BEGIN
  SELECT s.max_participants INTO max_p
  FROM public.sessions s
  WHERE s.id = NEW.session_id;

  IF max_p IS NULL THEN
    RAISE EXCEPTION 'session_not_found';
  END IF;

  -- Count both pending and confirmed as reserved capacity
  SELECT count(*) INTO current_count
  FROM public.session_participants sp
  WHERE sp.session_id = NEW.session_id
    AND sp.status IN ('pending', 'confirmed');

  IF current_count >= max_p THEN
    RAISE EXCEPTION 'session_full';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_session_capacity ON public.session_participants;
CREATE TRIGGER trg_enforce_session_capacity
BEFORE INSERT ON public.session_participants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_session_capacity();

-- 4) Restrict who can create sessions (certified/instructor/admin)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='sessions' AND policyname='Authenticated users can create sessions'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated users can create sessions" ON public.sessions';
  END IF;
END $$;

CREATE POLICY "Certified users can create sessions"
ON public.sessions
FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND (
    public.has_role(auth.uid(), 'certified'::public.app_role)
    OR public.has_role(auth.uid(), 'instructor'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
