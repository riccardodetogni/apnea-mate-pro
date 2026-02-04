-- Add status column to group_members for pending membership flow
-- Status can be: 'pending', 'approved', 'rejected'
ALTER TABLE public.group_members 
ADD COLUMN status text NOT NULL DEFAULT 'approved';

-- Update role column to support 'owner' role in addition to 'member' and 'admin'
-- No schema change needed since role is already text, but let's add an index

-- Create index for efficient membership queries by status
CREATE INDEX idx_group_members_status ON public.group_members(status);
CREATE INDEX idx_group_members_role ON public.group_members(role);

-- Create security definer function to check if user is group owner
CREATE OR REPLACE FUNCTION public.is_group_owner(_user_id uuid, _group_id uuid)
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
      AND role IN ('owner', 'admin')
      AND status = 'approved'
  )
  OR EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = _group_id
      AND created_by = _user_id
  )
$$;

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

-- New policy: Users can request to join groups (insert with pending status for requires_approval groups)
CREATE POLICY "Users can request to join groups"
ON public.group_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role = 'member'
  AND (
    -- If group requires approval, status must be pending
    (EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_id AND g.requires_approval = true
    ) AND status = 'pending')
    OR
    -- If group doesn't require approval, status must be approved
    (EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_id AND g.requires_approval = false
    ) AND status = 'approved')
  )
);

-- Users can remove themselves from groups (leave)
CREATE POLICY "Users can leave groups"
ON public.group_members
FOR DELETE
USING (auth.uid() = user_id);

-- Group owners can manage members (update status, change roles)
CREATE POLICY "Group owners can manage members"
ON public.group_members
FOR UPDATE
USING (public.is_group_owner(auth.uid(), group_id));

-- Group owners can remove members
CREATE POLICY "Group owners can remove members"
ON public.group_members
FOR DELETE
USING (public.is_group_owner(auth.uid(), group_id));

-- Group owners can add members directly (e.g., assign owners)
CREATE POLICY "Group owners can add members"
ON public.group_members
FOR INSERT
WITH CHECK (public.is_group_owner(auth.uid(), group_id));