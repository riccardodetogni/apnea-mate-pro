
-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewed_user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reviewer_id, reviewed_user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated can view all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id);

-- Anonymous view (strips reviewer_id)
CREATE VIEW public.anonymous_reviews AS
  SELECT id, reviewed_user_id, rating, comment, created_at, updated_at
  FROM public.reviews;

-- Eligibility function: can_review_user
CREATE OR REPLACE FUNCTION public.can_review_user(_reviewer_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _reviewer_id <> _target_id AND EXISTS (
    -- Both are confirmed participants in a past session
    SELECT 1
    FROM public.sessions s
    JOIN public.session_participants sp1 ON sp1.session_id = s.id AND sp1.user_id = _reviewer_id AND sp1.status = 'confirmed'
    JOIN public.session_participants sp2 ON sp2.session_id = s.id AND sp2.user_id = _target_id AND sp2.status = 'confirmed'
    WHERE s.date_time + (s.duration_minutes || ' minutes')::interval < now()

    UNION ALL

    -- Reviewer is confirmed participant, target is creator
    SELECT 1
    FROM public.sessions s
    JOIN public.session_participants sp ON sp.session_id = s.id AND sp.user_id = _reviewer_id AND sp.status = 'confirmed'
    WHERE s.creator_id = _target_id
      AND s.date_time + (s.duration_minutes || ' minutes')::interval < now()

    UNION ALL

    -- Reviewer is creator, target is confirmed participant
    SELECT 1
    FROM public.sessions s
    JOIN public.session_participants sp ON sp.session_id = s.id AND sp.user_id = _target_id AND sp.status = 'confirmed'
    WHERE s.creator_id = _reviewer_id
      AND s.date_time + (s.duration_minutes || ' minutes')::interval < now()
  );
$$;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NOT public.can_review_user(NEW.reviewer_id, NEW.reviewed_user_id) THEN
    RAISE EXCEPTION 'You are not eligible to review this user';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_before_insert_update
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review();

-- Timestamp trigger
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
