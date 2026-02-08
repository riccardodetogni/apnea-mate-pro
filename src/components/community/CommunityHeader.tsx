import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const CommunityHeader = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const userName = profile?.name || user?.email || "U";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between gap-3 mb-3.5">
      {/* User avatar */}
      <button 
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => navigate("/profile")}
      >
        <Avatar className="w-10 h-10 border-2 border-card">
          <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-primary-deep to-primary-light text-primary-foreground text-sm font-bold">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Title group */}
      <div className="text-center flex-1">
        <span className="text-[13px] text-muted tracking-wide uppercase block">
          {t("appName")}
        </span>
        <span className="text-xl font-semibold block -mt-0.5">
          {t("community")}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <NotificationBell />

        {/* My Sessions button */}
        <button
          onClick={() => navigate("/my-sessions")}
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-secondary transition-colors"
          title="Le mie sessioni"
        >
          <Calendar className="w-5 h-5 text-primary" />
        </button>

        {/* New session button */}
        <Button 
          variant="primaryGradient" 
          size="pill"
          onClick={() => navigate("/create/session")}
          className="text-[13px] py-2 px-3.5"
        >
          {t("newSession")}
        </Button>
      </div>
    </header>
  );
};
