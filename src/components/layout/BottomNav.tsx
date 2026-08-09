import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Globe, MessageCircle, LayoutGrid } from "lucide-react";
import { t } from "@/lib/i18n";
import { useConversations } from "@/hooks/useConversations";
import { BrandIcon } from "@/components/brand/BrandIcon";

const navItems: Array<{
  path: string;
  label: string;
  renderIcon: () => ReactNode;
}> = [
  { path: "/community", label: t("navCommunity"), renderIcon: () => <Globe className="w-5 h-5" /> },
  { path: "/spots", label: t("navSpot"), renderIcon: () => <BrandIcon name="spot" variant="color" size={24} /> },
  { path: "/messages", label: "Messaggi", renderIcon: () => <MessageCircle className="w-5 h-5" /> },
  { path: "/groups", label: t("navGroups"), renderIcon: () => <BrandIcon name="gruppi" variant="color" size={24} /> },
  { path: "/tools", label: "Tools", renderIcon: () => <LayoutGrid className="w-5 h-5" /> },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useConversations();

  return (
    <div className="bottom-nav-container safe-area-bottom">
      <div className="bottom-nav-inner">
        {navItems.map(({ path, renderIcon, label }) => {
          const isActive =
            location.pathname === path ||
            (path === "/community" && location.pathname === "/") ||
            (path === "/tools" &&
              (location.pathname.startsWith("/tools") ||
                location.pathname.startsWith("/logbook") ||
                location.pathname.startsWith("/training")));
          const showBadge = path === "/messages" && totalUnread > 0;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className="relative">
                {renderIcon()}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
