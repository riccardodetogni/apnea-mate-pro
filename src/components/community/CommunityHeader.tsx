import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const CommunityHeader = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const userName = profile?.name || user?.email || "U";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between gap-2 mb-3.5">
      {/* User avatar */}
      <button 
        className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        onClick={() => navigate("/profile")}
      >
        <Avatar className="w-10 h-10 border-2 border-white/20 shadow-lg shadow-primary/20">
          <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
          <AvatarFallback className="avatar-gradient text-white text-sm font-bold">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Title group */}
      <div className="text-center flex-1 min-w-0">
        <span className="text-[13px] tracking-wide uppercase block" style={{ color: 'hsl(222 47% 11% / 0.45)' }}>
          {t("appName")}
        </span>
        <span className="text-xl font-semibold block -mt-0.5 text-foreground">
          {t("community")}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Notification bell */}
        <NotificationBell />

        {/* My Sessions button */}
        <button
          onClick={() => navigate("/my-sessions")}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"
          style={{ 
            background: 'rgba(255,255,255,0.86)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(15,23,42,0.10)'
          }}
          title="Le mie sessioni"
        >
          <Calendar className="w-[18px] h-[18px] text-primary" />
        </button>

        {/* Create button */}
        <Button 
          variant="primaryGradient" 
          size="sm"
          onClick={() => navigate("/create")}
          className="rounded-full px-3.5 h-9 gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("navCreate")}
        </Button>
      </div>
    </header>
  );
};
