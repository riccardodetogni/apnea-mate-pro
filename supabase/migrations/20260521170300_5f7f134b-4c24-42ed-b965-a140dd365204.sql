ALTER TABLE public.waitlist
  ADD COLUMN language text NOT NULL DEFAULT 'it'
  CHECK (language IN ('it','en'));