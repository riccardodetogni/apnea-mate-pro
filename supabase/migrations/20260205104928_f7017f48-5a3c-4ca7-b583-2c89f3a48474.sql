-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'session_join_request',
  'session_request_approved',
  'session_request_rejected',
  'session_cancelled',
  'group_join_request',
  'group_request_approved',
  'new_follower'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Authenticated users can create notifications for others
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;