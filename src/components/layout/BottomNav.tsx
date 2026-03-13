import { useLocation, useNavigate } from "react-router-dom";
import { Globe, MapPin, Plus, MessageCircle, Users, BarChart3 } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/useConversations";

const navItems = [
  { path: "/community", icon: Globe, labelKey: "navCommunity" as const },
  { path: "/spots", icon: MapPin, labelKey: "navSpot" as const },
  { path: "/create", icon: Plus, labelKey: "navCreate" as const },
  { path: "/messages", icon: MessageCircle, labelKey: "navMessages" as const },
  { path: "/groups", icon: Users, labelKey: "navGroups" as const },
  { path: "/training", icon: BarChart3, labelKey: "navTraining" as const },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { totalUnread } = useConversations();

  return (
    <div className="bottom-nav-container safe-area-bottom">
      <div className="bottom-nav-inner">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path || 
            (path === "/community" && location.pathname === "/");
          const showBadge = path === "/messages" && totalUnread > 0;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
