-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view public sessions" ON public.sessions;

-- Create new policy that handles group-only visibility
-- Sessions are visible if:
-- 1. They are public (is_public = true)
-- 2. They are created by the current user
-- 3. They belong to a group the user is a member of (when is_public = false and group_id is set)
CREATE POLICY "Users can view accessible sessions"
ON public.sessions
FOR SELECT
USING (
  is_public = true
  OR creator_id = auth.uid()
  OR (
    is_public = false 
    AND group_id IS NOT NULL 
    AND public.is_group_member(auth.uid(), group_id)
  )
);