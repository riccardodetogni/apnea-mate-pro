import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "session_join_request"
  | "session_request_approved"
  | "session_request_rejected"
  | "session_cancelled"
  | "group_join_request"
  | "group_request_approved"
  | "group_verification_request"
  | "new_follower";

export interface NotificationMetadata {
  session_id?: string;
  session_title?: string;
  group_id?: string;
  group_name?: string;
  user_id?: string;
  user_name?: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
}: CreateNotificationParams) {
  // Use type assertion to work around the types not being regenerated yet
  const { error } = await supabase.from("notifications" as any).insert({
    user_id: userId,
    type,
    title,
    message,
    metadata,
  } as any);

  if (error) {
    console.error("Error creating notification:", error);
  }

  return { error };
}
