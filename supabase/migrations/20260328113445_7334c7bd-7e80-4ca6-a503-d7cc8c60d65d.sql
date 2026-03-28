
-- Step 1: Merge duplicate session conversations
-- For session 4a01eeb5: keep e9b26979 (has 3 messages)
-- Move participants from duplicates to primary
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT 'e9b26979-1a3b-4829-96ee-dfc744580c4e', cp.user_id
FROM conversation_participants cp
WHERE cp.conversation_id IN ('4defd2e9-4a69-43f3-b193-c6623fcf0013', '860b00ce-24e4-495e-88dd-fee01557ec30', '687dc0ba-3e66-4af2-af84-8a76c75b81ed')
ON CONFLICT DO NOTHING;

-- Move messages from duplicates to primary (none in this case but safe)
UPDATE messages SET conversation_id = 'e9b26979-1a3b-4829-96ee-dfc744580c4e'
WHERE conversation_id IN ('4defd2e9-4a69-43f3-b193-c6623fcf0013', '860b00ce-24e4-495e-88dd-fee01557ec30', '687dc0ba-3e66-4af2-af84-8a76c75b81ed');

-- Delete duplicate participants
DELETE FROM conversation_participants
WHERE conversation_id IN ('4defd2e9-4a69-43f3-b193-c6623fcf0013', '860b00ce-24e4-495e-88dd-fee01557ec30', '687dc0ba-3e66-4af2-af84-8a76c75b81ed');

-- Delete duplicate conversations
DELETE FROM conversations
WHERE id IN ('4defd2e9-4a69-43f3-b193-c6623fcf0013', '860b00ce-24e4-495e-88dd-fee01557ec30', '687dc0ba-3e66-4af2-af84-8a76c75b81ed');

-- For session 9254bc7e: keep cf97ce32 (has 1 message)
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT 'cf97ce32-1448-4aa2-a4d7-a4aafe88bb41', cp.user_id
FROM conversation_participants cp
WHERE cp.conversation_id IN ('047e27e5-60dd-466f-afc8-d9d6e665ceeb', '523e851d-0de1-4d3a-8bd9-62e361f81b7f', 'e0d9c3a3-2c4c-4a63-81d5-b102118ef8b2')
ON CONFLICT DO NOTHING;

UPDATE messages SET conversation_id = 'cf97ce32-1448-4aa2-a4d7-a4aafe88bb41'
WHERE conversation_id IN ('047e27e5-60dd-466f-afc8-d9d6e665ceeb', '523e851d-0de1-4d3a-8bd9-62e361f81b7f', 'e0d9c3a3-2c4c-4a63-81d5-b102118ef8b2');

DELETE FROM conversation_participants
WHERE conversation_id IN ('047e27e5-60dd-466f-afc8-d9d6e665ceeb', '523e851d-0de1-4d3a-8bd9-62e361f81b7f', 'e0d9c3a3-2c4c-4a63-81d5-b102118ef8b2');

DELETE FROM conversations
WHERE id IN ('047e27e5-60dd-466f-afc8-d9d6e665ceeb', '523e851d-0de1-4d3a-8bd9-62e361f81b7f', 'e0d9c3a3-2c4c-4a63-81d5-b102118ef8b2');

-- Step 2: Add unique partial indexes to prevent future duplicates
CREATE UNIQUE INDEX conversations_unique_session ON conversations (session_id) WHERE session_id IS NOT NULL AND type = 'session';
CREATE UNIQUE INDEX conversations_unique_group ON conversations (group_id) WHERE group_id IS NOT NULL AND type = 'group';
