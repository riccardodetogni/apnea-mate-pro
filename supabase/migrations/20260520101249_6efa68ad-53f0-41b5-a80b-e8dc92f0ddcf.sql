ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'course_join_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'course_request_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'course_request_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_join_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_request_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_request_rejected';