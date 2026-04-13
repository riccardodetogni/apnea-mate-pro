
-- Add event_id column to conversations
ALTER TABLE public.conversations
ADD COLUMN event_id uuid DEFAULT NULL;

-- Foreign key to events
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Unique partial index: one conversation per event
CREATE UNIQUE INDEX idx_conversations_event_id_unique
ON public.conversations (event_id)
WHERE type = 'event';

-- RPC to find conversation by event (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.find_conversation_by_event(_event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM conversations
  WHERE event_id = _event_id AND type = 'event'
  LIMIT 1;
$$;
