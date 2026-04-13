-- 1. Add verification_requested column to groups
ALTER TABLE public.groups ADD COLUMN verification_requested boolean NOT NULL DEFAULT false;

-- 2. Add group_verification_request to notification_type enum
ALTER TYPE public.notification_type ADD VALUE 'group_verification_request';