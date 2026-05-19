
DO $$
DECLARE
  keep_ids uuid[] := ARRAY[
    '3f5b72d1-48dd-44d9-bfa0-4765e0997631',
    '6049c4b1-0656-4fe5-ba41-f9ba84cb0247',
    'd76480af-7231-44fc-a6ca-406d3ce4d767',
    '7139e9c7-b399-4747-8c99-43cfe92b9d33',
    '06904323-1bf5-4a25-8223-8e86a4b951eb',
    '3927f428-a5f1-4e4c-aca9-de3eb2824f27'
  ]::uuid[];
BEGIN
  -- 1. Wipe activity/child tables
  DELETE FROM public.session_participants;
  DELETE FROM public.group_members;
  DELETE FROM public.spot_favorites;
  DELETE FROM public.follows;
  DELETE FROM public.notifications;
  DELETE FROM public.reviews;
  DELETE FROM public.personal_bests;
  DELETE FROM public.certifications;
  DELETE FROM public.training_presets;
  DELETE FROM public.messages;
  DELETE FROM public.conversation_participants;
  DELETE FROM public.conversations;
  DELETE FROM public.event_participants;
  DELETE FROM public.event_schedule;
  DELETE FROM public.course_participants;
  DELETE FROM public.group_tags;

  -- 2. Wipe content tables
  DELETE FROM public.sessions;
  DELETE FROM public.events;
  DELETE FROM public.courses;
  DELETE FROM public.groups;

  -- 3. Preserve spots: null out created_by for non-keep authors
  UPDATE public.spots
    SET created_by = NULL
    WHERE created_by IS NOT NULL
      AND created_by <> ALL(keep_ids);

  -- 4. Delete non-keep users
  DELETE FROM public.user_roles WHERE user_id <> ALL(keep_ids);
  DELETE FROM public.profiles  WHERE user_id <> ALL(keep_ids);
  DELETE FROM auth.users       WHERE id      <> ALL(keep_ids);
END $$;
