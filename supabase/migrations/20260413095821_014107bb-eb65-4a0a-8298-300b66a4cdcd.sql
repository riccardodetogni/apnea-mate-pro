
-- =====================
-- EVENTS
-- =====================
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_type text NOT NULL, -- stage, competition, trip
  start_date date NOT NULL,
  end_date date NOT NULL,
  location text,
  latitude numeric,
  longitude numeric,
  max_participants integer NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  creator_id uuid NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  cover_image_url text,
  contact_email text,
  contact_phone text,
  contact_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- SELECT: public events visible to all; private only to group members
CREATE POLICY "Anyone can view public events"
  ON public.events FOR SELECT
  USING (
    is_public = true
    OR creator_id = auth.uid()
    OR (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  );

-- INSERT: only instructors/admin OR group owners
CREATE POLICY "Instructors and group owners can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND (
      has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin')
      OR (group_id IS NOT NULL AND is_group_owner(auth.uid(), group_id))
    )
  );

CREATE POLICY "Creators can update own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own events"
  ON public.events FOR DELETE
  USING (auth.uid() = creator_id);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- EVENT SCHEDULE
-- =====================
CREATE TABLE public.event_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text,
  description text,
  start_time time,
  end_time time
);

ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event schedule"
  ON public.event_schedule FOR SELECT
  USING (true);

CREATE POLICY "Event creators can manage schedule"
  ON public.event_schedule FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_schedule.event_id AND e.creator_id = auth.uid())
  );

-- =====================
-- EVENT PARTICIPANTS
-- =====================
CREATE TABLE public.event_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join events"
  ON public.event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event creators can manage participants"
  ON public.event_participants FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_participants.event_id AND e.creator_id = auth.uid())
  );

CREATE POLICY "Users can leave events"
  ON public.event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- COURSES
-- =====================
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  course_type text NOT NULL, -- beginner, advanced, instructor, specialty
  start_date date NOT NULL,
  end_date date NOT NULL,
  location text,
  latitude numeric,
  longitude numeric,
  max_participants integer NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  creator_id uuid NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  cover_image_url text,
  contact_email text,
  contact_phone text,
  contact_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public courses"
  ON public.courses FOR SELECT
  USING (
    is_public = true
    OR creator_id = auth.uid()
    OR (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  );

CREATE POLICY "Instructors and group owners can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND (
      has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin')
      OR (group_id IS NOT NULL AND is_group_owner(auth.uid(), group_id))
    )
  );

CREATE POLICY "Creators can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = creator_id);

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- COURSE PARTICIPANTS
-- =====================
CREATE TABLE public.course_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.course_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course participants"
  ON public.course_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join courses"
  ON public.course_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Course creators can manage participants"
  ON public.course_participants FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_participants.course_id AND c.creator_id = auth.uid())
  );

CREATE POLICY "Users can leave courses"
  ON public.course_participants FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_participants;
