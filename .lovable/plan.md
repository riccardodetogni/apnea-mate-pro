

# Plan: In-App Notification Center

## Summary
Build a comprehensive in-app notification system that stores all user notifications in the database, displays them via a bell icon with unread count in the header, and provides a full-screen drawer to view and manage notification history.

---

## What This Will Enable

Users will be notified in-app for:
- **Session Events**: Join requests, approvals, rejections, cancellations
- **Group Events**: Join requests, approvals, member additions
- **Social Events**: New followers

The notification center will show a chronological list of all past notifications, with clear visual distinction between read and unread items.

---

## Architecture Overview

```text
+------------------+       +------------------+       +------------------+
|   User Action    | --->  |   Create         | --->  |   notifications  |
|   (join, follow) |       |   Notification   |       |   table          |
+------------------+       +------------------+       +------------------+
                                                              |
                                                              v
                           +------------------+       +------------------+
                           |   Bell Icon      | <---  |   useNotifications|
                           |   (unread count) |       |   hook            |
                           +------------------+       +------------------+
                                   |
                                   v
                           +------------------+
                           |   Notifications  |
                           |   Drawer         |
                           +------------------+
```

---

## Implementation Steps

### Step 1: Create Notifications Table
A new database table to persist all notifications with:
- `id` - Primary key
- `user_id` - Recipient user
- `type` - Notification type enum
- `title` - Notification title
- `message` - Notification body
- `metadata` - JSON for related IDs (session_id, group_id, etc.)
- `read` - Boolean for read status
- `created_at` - Timestamp

Enable Realtime so new notifications appear instantly.

### Step 2: Create useNotifications Hook
A custom React hook that:
- Fetches notifications for the current user
- Provides unread count
- Subscribes to Realtime for instant updates
- Exposes functions: `markAsRead`, `markAllAsRead`, `refetch`

### Step 3: Add Bell Icon to CommunityHeader
- Place notification bell next to the "My Sessions" calendar button
- Show red badge with unread count when > 0
- Click opens the notifications drawer

### Step 4: Create NotificationsDrawer Component
A bottom sheet/drawer that displays:
- "Mark all as read" action button
- Scrollable list of notifications
- Each notification shows icon, title, message, relative time
- Tapping a notification marks it as read and navigates to relevant page

### Step 5: Integrate Notification Creation
Add notification creation at key trigger points:
- `SessionDetails.tsx`: When join request is submitted, approved, or rejected
- `GroupDetails.tsx` / `GroupManage.tsx`: When group join request is submitted or approved
- `useFollow.ts`: When a user follows another user

### Step 6: Extend Edge Function (Optional Enhancement)
Modify `send-session-notification` to also create in-app notifications, ensuring both email and in-app are triggered together.

---

## Database Migration

```sql
-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'session_join_request',
  'session_request_approved',
  'session_request_rejected',
  'session_cancelled',
  'group_join_request',
  'group_request_approved',
  'new_follower'
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Service role or authenticated users can insert notifications for others
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## New Files to Create

### 1. `src/hooks/useNotifications.ts`
Custom hook for managing notifications state and Realtime subscription.

### 2. `src/components/notifications/NotificationsDrawer.tsx`
The drawer/sheet component displaying notification list.

### 3. `src/components/notifications/NotificationItem.tsx`
Individual notification row component with icon, title, message, and time.

### 4. `src/components/notifications/NotificationBell.tsx`
Bell icon button with unread badge for the header.

---

## Files to Modify

### 1. `src/components/community/CommunityHeader.tsx`
- Import and add NotificationBell component
- Manage drawer open/close state

### 2. `src/pages/SessionDetails.tsx`
- Add notification creation when:
  - User submits join request (notify session creator)
  - Creator approves request (notify participant)
  - Creator rejects request (notify participant)

### 3. `src/pages/GroupDetails.tsx`
- Add notification creation when user requests to join a group (notify group owner)

### 4. `src/pages/GroupManage.tsx`
- Add notification creation when owner approves/rejects member request

### 5. `src/hooks/useFollow.ts`
- Add notification creation when user follows another user

### 6. `supabase/functions/send-session-notification/index.ts` (optional)
- Add in-app notification creation alongside email sending

---

## Technical Details

### Notification Types and Icons

| Type | Icon | Color |
|------|------|-------|
| session_join_request | UserPlus | blue |
| session_request_approved | Check | green |
| session_request_rejected | X | red |
| session_cancelled | XCircle | red |
| group_join_request | Users | blue |
| group_request_approved | Check | green |
| new_follower | Heart | pink |

### Notification Metadata Structure
```typescript
interface NotificationMetadata {
  session_id?: string;
  session_title?: string;
  group_id?: string;
  group_name?: string;
  user_id?: string;
  user_name?: string;
}
```

### Realtime Subscription Pattern
```typescript
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        // Add new notification to state
        setNotifications(prev => [payload.new, ...prev]);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [user?.id]);
```

### UI Behavior
- Bell icon shows red dot/badge when unread count > 0
- Clicking bell opens drawer from bottom (80% height)
- Notifications sorted by created_at descending (newest first)
- Unread notifications have highlighted background
- Tapping notification:
  1. Marks it as read
  2. Closes drawer
  3. Navigates to relevant page based on type/metadata
- "Mark all as read" button at top of drawer

---

## Notification Creation Helper

Create a utility function to standardize notification creation:

```typescript
// src/lib/notifications.ts
export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {}
}: CreateNotificationParams) {
  return supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    metadata
  });
}
```

---

## Summary of Changes

| Category | Files |
|----------|-------|
| Database | 1 migration (notifications table + RLS + Realtime) |
| New Components | 4 files (NotificationBell, NotificationsDrawer, NotificationItem, useNotifications) |
| Modified Files | 5 files (CommunityHeader, SessionDetails, GroupDetails, GroupManage, useFollow) |
| Optional | 1 edge function update |

