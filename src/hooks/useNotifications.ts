import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { NotificationType, NotificationMetadata } from "@/lib/notifications";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  read: boolean;
  created_at: string;
}

async function fetchNotificationsData(userId: string): Promise<Notification[]> {
  const { data, error } = await (supabase.from("notifications" as any) as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as Notification[];
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotificationsData(user!.id),
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotification = payload.new as Notification;
          queryClient.setQueryData(["notifications", user.id], (old: Notification[] | undefined) =>
            old ? [newNotification, ...old] : [newNotification]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Notification;
          queryClient.setQueryData(["notifications", user.id], (old: Notification[] | undefined) =>
            old ? old.map((n) => (n.id === updated.id ? updated : n)) : old
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase.from("notifications" as any) as any)
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;

      queryClient.setQueryData(["notifications", user?.id], (old: Notification[] | undefined) =>
        old ? old.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) : old
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await (supabase.from("notifications" as any) as any)
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;

      queryClient.setQueryData(["notifications", user.id], (old: Notification[] | undefined) =>
        old ? old.map((n) => ({ ...n, read: true })) : old
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await (supabase.from("notifications" as any) as any)
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;

      queryClient.setQueryData(["notifications", user.id], []);
    } catch (err) {
      console.error("Error deleting all notifications:", err);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  };
};
