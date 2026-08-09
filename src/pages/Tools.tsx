import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, BookOpen, ClipboardList, PenSquare } from "lucide-react";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  disabled?: boolean;
  iconTint: string;
}

const ToolCard = ({ icon, title, subtitle, onClick, disabled, iconTint }: ToolCardProps) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className="card-session !rounded-2xl !p-4 text-left relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
      style={{ background: iconTint }}
    >
      {icon}
    </div>
    <h3 className="font-semibold text-card-foreground text-base leading-tight">{title}</h3>
    <p className="text-xs text-[hsl(var(--card-muted))] mt-1 leading-snug">{subtitle}</p>
    {disabled && (
      <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/85 border border-white/20">
        {t("toolsComingSoon")}
      </span>
    )}
  </button>
);

const Tools = () => {
  const navigate = useNavigate();
  const { isStaff } = useStaffAccess();

  return (
    <AppLayout>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("toolsTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("toolsSubtitle")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <ToolCard
          icon={<BarChart3 className="w-5 h-5 text-[hsl(185,57%,80%)]" />}
          iconTint="rgba(63, 189, 200, 0.22)"
          title={t("toolTraining")}
          subtitle={t("toolTrainingDesc")}
          onClick={() => navigate("/training")}
        />
        <ToolCard
          icon={<BookOpen className="w-5 h-5 text-[hsl(228,80%,80%)]" />}
          iconTint="rgba(63, 102, 232, 0.22)"
          title={t("toolLogbook")}
          subtitle={t("toolLogbookDesc")}
          onClick={() => navigate("/logbook")}
        />
        {isStaff && (
          <ToolCard
            icon={<ClipboardList className="w-5 h-5 text-[hsl(270,70%,82%)]" />}
            iconTint="rgba(139, 92, 246, 0.22)"
            title={t("toolRegister")}
            subtitle={t("toolRegisterDesc")}
            onClick={() => navigate("/registro")}
          />
        )}
        {isStaff && (
          <ToolCard
            icon={<PenSquare className="w-5 h-5 text-[hsl(35,85%,80%)]" />}
            iconTint="rgba(234, 179, 8, 0.22)"
            title={t("toolSignDive")}
            subtitle={t("toolSignDiveDesc")}
            onClick={() => navigate("/tools/sign-dive")}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Tools;
