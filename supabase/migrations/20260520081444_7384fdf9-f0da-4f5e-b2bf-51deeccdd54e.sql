DROP POLICY IF EXISTS "Verified group owners can create events" ON public.events;
DROP POLICY IF EXISTS "Verified group owners can create courses" ON public.courses;

CREATE POLICY "Instructors and admins can create events"
ON public.events
FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  )
  AND (
    group_id IS NULL
    OR public.is_group_owner(auth.uid(), group_id)
  )
);

CREATE POLICY "Instructors and admins can create courses"
ON public.courses
FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  )
  AND (
    group_id IS NULL
    OR public.is_group_owner(auth.uid(), group_id)
  )
);