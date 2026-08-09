-- 1. profiles: opt-out toggle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notify_chat boolean NOT NULL DEFAULT true;

-- 2. pending_chat_email_notifications
CREATE TABLE IF NOT EXISTS public.pending_chat_email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  first_unread_message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  first_unread_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL,
  last_emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS pending_chat_email_notifications_scheduled_for_idx
  ON public.pending_chat_email_notifications (scheduled_for);
CREATE INDEX IF NOT EXISTS pending_chat_email_notifications_user_id_idx
  ON public.pending_chat_email_notifications (user_id);

GRANT SELECT ON public.pending_chat_email_notifications TO authenticated;
GRANT ALL ON public.pending_chat_email_notifications TO service_role;

ALTER TABLE public.pending_chat_email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their pending chat notifications"
  ON public.pending_chat_email_notifications;
CREATE POLICY "Users view their pending chat notifications"
  ON public.pending_chat_email_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- (guard added during promotion: the only non-re-runnable statement in this migration)
DROP TRIGGER IF EXISTS update_pending_chat_email_notifications_updated_at
  ON public.pending_chat_email_notifications;
CREATE TRIGGER update_pending_chat_email_notifications_updated_at
  BEFORE UPDATE ON public.pending_chat_email_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Enqueue on new message
CREATE OR REPLACE FUNCTION public.enqueue_chat_email_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pending_chat_email_notifications
    (conversation_id, user_id, first_unread_message_id, first_unread_at, scheduled_for)
  SELECT
    NEW.conversation_id,
    cp.user_id,
    NEW.id,
    NEW.created_at,
    NEW.created_at + interval '12 minutes'
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id <> NEW.sender_id
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message_enqueue_email ON public.messages;
CREATE TRIGGER on_new_message_enqueue_email
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_chat_email_notifications();

-- 4. Clear pending notifications when the recipient reads the conversation
CREATE OR REPLACE FUNCTION public.clear_pending_chat_email_on_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_read_at IS DISTINCT FROM OLD.last_read_at THEN
    DELETE FROM public.pending_chat_email_notifications p
    WHERE p.conversation_id = NEW.conversation_id
      AND p.user_id = NEW.user_id
      AND (NEW.last_read_at IS NULL OR p.first_unread_at <= NEW.last_read_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_conversation_read_clear_pending ON public.conversation_participants;
CREATE TRIGGER on_conversation_read_clear_pending
  AFTER UPDATE OF last_read_at ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.clear_pending_chat_email_on_read();