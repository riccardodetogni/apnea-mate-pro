-- Phase 1: Add search_visibility to profiles and verified to groups

-- 1. Add search_visibility to profiles (default true = visible in search)
ALTER TABLE public.profiles 
ADD COLUMN search_visibility boolean NOT NULL DEFAULT true;

-- 2. Add verified flag to groups (admin-only managed)
ALTER TABLE public.groups 
ADD COLUMN verified boolean NOT NULL DEFAULT false;

-- Add index on search_visibility for efficient filtering
CREATE INDEX idx_profiles_search_visibility ON public.profiles(search_visibility) WHERE search_visibility = true;