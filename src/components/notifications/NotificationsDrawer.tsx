import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { t } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDrawer = ({ open, onOpenChange }: NotificationsDrawerProps) => {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteAllNotifications } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Close drawer
    onOpenChange(false);

    // Navigate based on type and metadata
    const { metadata, type } = notification;

    if (type.startsWith("session_") && metadata.session_id) {
      navigate(`/session/${metadata.session_id}`);
    } else if (type.startsWith("group_") && metadata.group_id) {
      navigate(`/group/${metadata.group_id}`);
    } else if (type === "new_follower" && metadata.user_id) {
      navigate(`/user/${metadata.user_id}`);
    }
  };

  const handleClearAll = async () => {
    await deleteAllNotifications();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t("notifications")}
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </DrawerTitle>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  {t("markAllAsRead")}
                </Button>
              )}
              {notifications.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Elimina tutte le notifiche</AlertDialogTitle>
                      <AlertDialogDescription>
                        Vuoi eliminare tutte le notifiche? Questa azione non può essere annullata.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Elimina tutto
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {t("noNotifications")}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t("noNotificationsDesc")}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
