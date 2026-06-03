CREATE POLICY "Admins can update any spot"
  ON public.spots FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any spot"
  ON public.spots FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));