import {
  UserPlus,
  Check,
  X,
  XCircle,
  Users,
  Heart,
  Shield,
  GraduationCap,
  CalendarDays,
  PenSquare,
  FilePlus,
  Lock,

} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const iconMap = {
  session_join_request: { icon: UserPlus, color: "text-blue-500" },
  session_request_approved: { icon: Check, color: "text-green-500" },
  session_request_rejected: { icon: X, color: "text-red-500" },
  session_cancelled: { icon: XCircle, color: "text-red-500" },
  group_join_request: { icon: Users, color: "text-blue-500" },
  group_request_approved: { icon: Check, color: "text-green-500" },
  group_verification_request: { icon: Shield, color: "text-amber-500" },
  new_follower: { icon: Heart, color: "text-pink-500" },
  course_join_request: { icon: GraduationCap, color: "text-blue-500" },
  course_request_approved: { icon: Check, color: "text-green-500" },
  course_request_rejected: { icon: X, color: "text-red-500" },
  event_join_request: { icon: CalendarDays, color: "text-blue-500" },
  event_request_approved: { icon: Check, color: "text-green-500" },
  event_request_rejected: { icon: X, color: "text-red-500" },
  signature_request: { icon: PenSquare, color: "text-primary" },
  signature_reminder: { icon: PenSquare, color: "text-amber-500" },
  dive_log_signed: { icon: PenSquare, color: "text-green-500" },
  dive_log_created: { icon: FilePlus, color: "text-blue-500" },
  register_closed: { icon: Lock, color: "text-amber-500" },

};

export const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const { icon: Icon, color } = iconMap[notification.type] || { 
    icon: UserPlus, 
    color: "text-muted-foreground" 
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: it,
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/50",
        !notification.read && "bg-primary/5"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        !notification.read ? "bg-primary/10" : "bg-muted"
      )}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "text-sm line-clamp-1",
            !notification.read ? "font-semibold" : "font-medium"
          )}>
            {notification.title}
          </h4>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <span className="text-xs text-muted-foreground mt-1 block">
          {timeAgo}
        </span>
      </div>
    </button>
  );
};
