-- Add optional group_id to sessions table
ALTER TABLE public.sessions 
ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_sessions_group_id ON public.sessions(group_id);

-- Update RLS to allow viewing sessions through group membership (optional enhancement)
-- The existing policies already handle this via is_public or creator_id check