

# Add Chat Support for Events

## What changes

Add a group chat to events, following the same pattern used for sessions and groups. Confirmed participants and the event creator can chat within the event detail page.

## Database changes (1 migration)

1. **Add `event_id` column** to `conversations` table (uuid, nullable, default null)
2. **Create RPC function** `find_conversation_by_event(_event_id uuid)` — SECURITY DEFINER, same pattern as session/group
3. **Create unique partial index** on `conversations(event_id)` where `type = 'event'` to prevent duplicate event chats

## Code changes

### `src/hooks/useConversations.ts`
- Add `event_id` to `ConversationListItem` interface
- Add `"event"` to the type union
- In `fetchConversations`, handle `conv.type === "event"` — fetch event title for display name, use `Ticket` icon
- Add `getOrCreateEventConversation(eventId, userId)` helper using `find_conversation_by_event` RPC

### `src/components/chat/ConversationItem.tsx`
- Import `Ticket` icon
- Add `conversation.type === "event"` to icon mapping

### `src/pages/EventDetails.tsx`
- Add "Chat" button (visible to confirmed participants and creator)
- On click, call `getOrCreateEventConversation` then navigate to `/messages/:convId`

### `src/integrations/supabase/types.ts`
- Will auto-update after migration (new `event_id` column + RPC function)

## Implementation order
1. DB migration (add column + RPC + index)
2. Update `useConversations` with event support + new helper
3. Update `ConversationItem` icon
4. Add chat button to `EventDetails`

