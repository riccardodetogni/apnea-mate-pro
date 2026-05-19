-- Feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category NOT IN ('bug','suggestion','other') THEN
    RAISE EXCEPTION 'Invalid feedback category';
  END IF;
  IF NEW.status NOT IN ('new','in_review','resolved') THEN
    RAISE EXCEPTION 'Invalid feedback status';
  END IF;
  IF char_length(trim(NEW.message)) < 1 OR char_length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Feedback message must be 1-2000 characters';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_feedback_trigger
BEFORE INSERT OR UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.validate_feedback();

-- RLS policies
CREATE POLICY "Users can insert own feedback"
ON public.feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON public.feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update feedback"
ON public.feedback FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feedback"
ON public.feedback FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_feedback_status_created ON public.feedback (status, created_at DESC);
CREATE INDEX idx_feedback_user ON public.feedback (user_id, created_at DESC);