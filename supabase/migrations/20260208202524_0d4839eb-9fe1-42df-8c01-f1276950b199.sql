
CREATE TABLE public.personal_bests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  max_depth_cwt numeric,
  max_static_sta integer,
  max_dynamic_dyn numeric,
  max_dynamic_dnf numeric,
  max_fim numeric,
  show_on_profile boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view personal bests"
  ON public.personal_bests FOR SELECT USING (true);

CREATE POLICY "Users can insert own personal bests"
  ON public.personal_bests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal bests"
  ON public.personal_bests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_personal_bests_updated_at
  BEFORE UPDATE ON public.personal_bests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
