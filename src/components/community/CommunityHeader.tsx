import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

export const CommunityHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between gap-3 mb-3.5">
      {/* User avatar */}
      <button 
        className="avatar-user cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => navigate("/profile")}
      >
        {userInitial}
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
