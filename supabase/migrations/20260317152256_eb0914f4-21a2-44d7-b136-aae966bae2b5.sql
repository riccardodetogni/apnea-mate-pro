
-- Fix: Drop security definer view and recreate with security_invoker
DROP VIEW IF EXISTS public.anonymous_reviews;
CREATE VIEW public.anonymous_reviews
WITH (security_invoker = true)
AS SELECT id, reviewed_user_id, rating, comment, created_at, updated_at
FROM public.reviews;
