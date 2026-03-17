
ALTER TABLE public.profiles
  ADD COLUMN has_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN insurance_provider text;
