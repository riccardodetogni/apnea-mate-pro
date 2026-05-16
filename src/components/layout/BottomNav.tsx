import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Globe, MessageCircle, BarChart3 } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/useConversations";
import { CreateDisclaimerModal } from "@/components/community/CreateDisclaimerModal";
import { BrandIcon } from "@/components/brand/BrandIcon";

const navItems: Array<{
  path: string;
  labelKey: "navCommunity" | "navSpot" | "navMessages" | "navGroups" | "navTraining";
  renderIcon: () => ReactNode;
}> = [
  { path: "/community", labelKey: "navCommunity", renderIcon: () => <Globe className="w-5 h-5" /> },
  { path: "/spots", labelKey: "navSpot", renderIcon: () => <BrandIcon name="spot" variant="color" size={24} /> },
  { path: "/messages", labelKey: "navMessages", renderIcon: () => <MessageCircle className="w-5 h-5" /> },
  { path: "/groups", labelKey: "navGroups", renderIcon: () => <BrandIcon name="gruppi" variant="color" size={24} /> },
  { path: "/training", labelKey: "navTraining", renderIcon: () => <BarChart3 className="w-5 h-5" /> },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { totalUnread } = useConversations();
  const [trainingDisclaimerOpen, setTrainingDisclaimerOpen] = useState(false);

  return (
    <div className="bottom-nav-container safe-area-bottom">
      <div className="bottom-nav-inner">
        {navItems.map(({ path, renderIcon, labelKey }) => {
          const isActive = location.pathname === path || 
            (path === "/community" && location.pathname === "/");
          const showBadge = path === "/messages" && totalUnread > 0;
          
          return (
            <button
              key={path}
              onClick={() => {
                if (path === "/training") {
                  setTrainingDisclaimerOpen(true);
                } else {
                  navigate(path);
                }
              }}
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
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
      <CreateDisclaimerModal
        open={trainingDisclaimerOpen}
        onClose={() => setTrainingDisclaimerOpen(false)}
        onConfirm={() => {
          setTrainingDisclaimerOpen(false);
          navigate("/training");
        }}
        checkboxText={t("trainingDisclaimerCheckbox")}
      />
    </div>
  );
};
