import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { cn } from "@/lib/utils";

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-secondary transition-colors"
        title="Notifiche"
      >
        <Bell className="w-5 h-5 text-primary" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center",
              unreadCount > 9 ? "w-5 h-5 text-[10px]" : "w-4 h-4"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};
