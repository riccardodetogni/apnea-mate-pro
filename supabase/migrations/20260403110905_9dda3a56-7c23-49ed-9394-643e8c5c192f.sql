
CREATE OR REPLACE FUNCTION public.find_conversation_by_session(_session_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM conversations
  WHERE session_id = _session_id AND type = 'session'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.find_conversation_by_group(_group_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM conversations
  WHERE group_id = _group_id AND type = 'group'
  LIMIT 1;
$$;
