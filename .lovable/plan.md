

# Fix Chat System: Duplicates, Missing Messages, Back Button

## Problems Identified

1. **Duplicate session conversations**: `getOrCreateSessionConversation` has a race condition — no unique constraint on `(session_id, type)`, so multiple calls create duplicate conversations for the same session. DB shows 4 conversations for the same session ID. This causes multiple identical entries in the Messages list.

2. **Messages not visible**: RLS policy on messages requires `is_conversation_participant(auth.uid(), conversation_id)`. When a new conversation is created but the user clicks into a *different* duplicate conversation (one where they're not a participant), messages return empty.

3. **Back button from chat always goes to `/messages`**: Line 40 in `ChatThread.tsx` hardcodes `navigate("/messages")`. Should use `navigate(-1)` or smart back logic to return to the previous page (e.g. session details).

## Changes

### 1. Database migration — add unique constraint + clean up duplicates
- Add a unique partial index: `CREATE UNIQUE INDEX ON conversations (session_id) WHERE session_id IS NOT NULL AND type = 'session'`
- Add a unique partial index: `CREATE UNIQUE INDEX ON conversations (group_id) WHERE group_id IS NOT NULL AND type = 'group'`
- Before adding constraints, merge duplicate conversations: migrate participants and messages to the oldest conversation per session/group, then delete duplicates

### 2. `src/hooks/useConversations.ts` — fix `getOrCreateSessionConversation`
- Use `INSERT ... ON CONFLICT DO NOTHING` pattern via upsert or handle the duplicate gracefully
- After inserting, re-query to get the existing row if conflict occurred
- Same fix for `getOrCreateGroupConversation`

### 3. `src/pages/ChatThread.tsx` — smart back button
- Change back button from `navigate("/messages")` to `navigate(-1)`
- Add fallback: if no history, fall back to `/messages`

### 4. `src/pages/SessionDetails.tsx` — ensure participant added on conversation open
- Already does upsert for current user as participant (line 453) — verify this works correctly with deduplicated conversations

## Technical details
- The unique partial indexes prevent future duplicates at the DB level
- Migration script: for each `session_id` with multiple conversations, keep the one with the most messages, move participants/messages from others, delete the rest
- The `getOrCreate` functions will use the upsert-with-returning pattern to handle concurrent calls safely

