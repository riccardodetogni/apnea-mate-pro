
-- 1. Create helper function
CREATE OR REPLACE FUNCTION public.is_verified_group_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    JOIN public.group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = _user_id
      AND gm.role IN ('owner', 'admin')
      AND gm.status = 'approved'
      AND g.verified = true
  )
$$;

-- 2. Update events INSERT policy
DROP POLICY "Instructors and group owners can create events" ON public.events;
CREATE POLICY "Verified group owners can create events" ON public.events
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = creator_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR (
        group_id IS NOT NULL
        AND is_group_owner(auth.uid(), group_id)
        AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND verified = true)
      )
    )
  );

-- 3. Update courses INSERT policy
DROP POLICY "Instructors and group owners can create courses" ON public.courses;
CREATE POLICY "Verified group owners can create courses" ON public.courses
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = creator_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR (
        group_id IS NOT NULL
        AND is_group_owner(auth.uid(), group_id)
        AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND verified = true)
      )
    )
  );
