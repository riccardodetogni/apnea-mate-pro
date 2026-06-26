-- 1. Additive columns
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at  timestamptz NULL,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

-- 2. Tamper-prevention trigger: sender/conversation/created_at are immutable,
--    and a soft-deleted message cannot be edited further.
CREATE OR REPLACE FUNCTION public.prevent_message_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'sender_id is immutable';
END IF;
IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'conversation_id is immutable';
END IF;
IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'created_at is immutable';
END IF;
IF OLD.deleted_at IS NOT NULL
AND (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
OR NEW.content IS DISTINCT FROM OLD.content
OR NEW.edited_at IS DISTINCT FROM OLD.edited_at) THEN
    RAISE EXCEPTION 'message is deleted and cannot be modified';
END IF;
RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_message_tampering_trg ON public.messages;
CREATE TRIGGER prevent_message_tampering_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.prevent_message_tampering();

-- 3. RLS: allow sender (and conversation participant) to UPDATE own messages.
DROP POLICY IF EXISTS "Senders can edit own messages" ON public.messages;
CREATE POLICY "Senders can edit own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
auth.uid() = sender_id
AND public.is_conversation_participant(auth.uid(), conversation_id)
  )
WITH CHECK (
auth.uid() = sender_id
AND public.is_conversation_participant(auth.uid(), conversation_id)
  );

-- No DELETE policy intentionally — soft delete only.