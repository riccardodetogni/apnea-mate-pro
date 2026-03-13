import { useLocation, useNavigate } from "react-router-dom";
import { Globe, MapPin, MessageCircle, Users, BarChart3 } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/useConversations";

const navItems = [
  { path: "/community", icon: Globe, labelKey: "navCommunity" as const },
  { path: "/spots", icon: MapPin, labelKey: "navSpot" as const },
  { path: "/messages", icon: MessageCircle, labelKey: "navMessages" as const },
  { path: "/groups", icon: Users, labelKey: "navGroups" as const },
  { path: "/training", icon: BarChart3, labelKey: "navTraining" as const },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="bottom-nav-container safe-area-bottom">
      <div className="bottom-nav-inner">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path || 
            (path === "/community" && location.pathname === "/");
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
