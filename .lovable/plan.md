

# Auto-Approve Creator Joining Own Session

## Problem

When the session creator didn't check "I'm joining" at creation time, they later see a "Join" button. Clicking it inserts them as `pending`, requiring them to approve themselves — which makes no sense.

## Solution

When the creator joins their own session, insert as `pending` (required by RLS), then immediately update to `confirmed`. Skip all notifications (no need to notify yourself). Show a "joined" toast instead of "request sent".

## Changes

### 1. `src/hooks/useSessions.ts` — `joinSession`
- After insert, check if `user.id === creator_id` (fetch session's `creator_id`)
- If creator: immediately update the participant row to `status: 'confirmed'`
- Skip notification creation and email sending
- The RLS update policy allows this because creator can manage participants

### 2. `src/pages/SessionDetails.tsx` — `confirmJoin`
- Same logic: after inserting participant, check if `user.id === session.creator_id`
- If yes: update status to `confirmed`, skip notifications, show "Ti sei iscritto!" toast
- If no: existing pending flow

### 3. `src/pages/SpotDetails.tsx` — `confirmJoin`
- Same pattern: check `session.creator_id === user?.id` after insert
- Auto-confirm + skip notifications if creator

### 4. `src/pages/Community.tsx` — `confirmJoinSession`
- Same pattern using `creatorId` from `SessionWithDetails`

### Files
- `src/hooks/useSessions.ts`
- `src/pages/SessionDetails.tsx`
- `src/pages/SpotDetails.tsx`
- `src/pages/Community.tsx`

No database changes — the existing RLS update policy already allows session creators to update participant status.

