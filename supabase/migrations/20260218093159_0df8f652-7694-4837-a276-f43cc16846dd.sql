
CREATE TABLE public.training_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  mode text NOT NULL,
  config jsonb NOT NULL,
  custom_rows jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.training_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presets" ON public.training_presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own presets" ON public.training_presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presets" ON public.training_presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own presets" ON public.training_presets FOR DELETE USING (auth.uid() = user_id);
