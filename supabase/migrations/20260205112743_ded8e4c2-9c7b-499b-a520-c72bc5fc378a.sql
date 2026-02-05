-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view accessible sessions" ON public.sessions;

-- Create updated policy that allows viewing sessions for public groups
-- Users can view sessions if:
-- 1. The session is public
-- 2. They are the creator
-- 3. The session belongs to a group they are a member of
-- 4. NEW: The session belongs to a public group (anyone can see it)
CREATE POLICY "Users can view accessible sessions" 
ON public.sessions 
FOR SELECT 
USING (
  (is_public = true) 
  OR (creator_id = auth.uid()) 
  OR ((is_public = false) AND (group_id IS NOT NULL) AND is_group_member(auth.uid(), group_id))
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = sessions.group_id 
      AND g.is_public = true
    )
  )
);