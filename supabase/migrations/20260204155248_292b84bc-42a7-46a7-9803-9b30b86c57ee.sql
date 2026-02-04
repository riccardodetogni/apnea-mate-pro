-- Add missing columns to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'community';

-- Enable realtime for groups
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;