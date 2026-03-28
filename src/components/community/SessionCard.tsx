import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { Check, Clock, DollarSign } from "lucide-react";

interface SessionCardProps {
  spotName: string;
  environmentType: string;
  sessionType: string;
  dateTime: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced" | "allLevels";
  spotsAvailable: number;
  spotsTotal: number;
  creatorName: string;
  creatorInitial: string;
  creatorRole: "instructor" | "instructorF" | "user";
  isJoined?: boolean;
  isPending?: boolean;
  isFull?: boolean;
  showJoinButton?: boolean;
  onJoin?: () => void;
  onDetails?: () => void;
  onClick?: () => void;
}

const levelLabels = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
  allLevels: "allLevels",
} as const;

export const SessionCard = ({
  spotName,
  environmentType,
  sessionType,
  dateTime,
  title,
  level,
  spotsAvailable,
  spotsTotal,
  creatorName,
  creatorInitial,
  creatorRole,
  isJoined = false,
  isPending = false,
  isFull = false,
  showJoinButton = true,
  onJoin,
  onDetails,
  onClick,
}: SessionCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on button
    if ((e.target as HTMLElement).closest('button')) return;
    onClick?.();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isJoined || isPending || isFull || !showJoinButton) {
      onDetails?.();
    } else {
      onJoin?.();
    }
  };

  // Determine button state
  const getButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Clock className="w-3.5 h-3.5" />
          In attesa
        </>
      );
    }
    if (isJoined) {
      return (
        <>
          <Check className="w-3.5 h-3.5" />
          Iscritto
        </>
      );
    }
    if (isFull) {
      return t("details");
    }
    if (showJoinButton) {
      return t("join");
    }
    return t("details");
  };

  const getButtonVariant = () => {
    if (isPending) return "pillOutline" as const;
    if (isJoined) return "pill" as const;
    if (isFull || !showJoinButton) return "pillOutline" as const;
    return "pill" as const;
  };

  return (
    <div 
      className="card-session min-w-[260px] animate-fade-in cursor-pointer transition-all hover:scale-[1.02]"
      onClick={handleCardClick}
    >
      {/* Top section - tags and meta */}
      <div className="flex flex-col gap-0.5 text-xs">
        <div className="flex gap-1.5 flex-wrap">
          <span className="chip-session">{spotName} · {environmentType}</span>
          <span className="chip-session">{sessionType}</span>
        </div>
        <div className="text-xs text-white/55 mt-1">{dateTime}</div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>

      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap mt-0.5">
        <span className="badge-level">{t(levelLabels[level])}</span>
        <span className="badge-spots">{spotsAvailable}/{spotsTotal} {t("spots")}</span>
      </div>

      {/* Bottom - creator and action */}
      <div className="flex justify-between items-center mt-1 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="avatar-creator flex-shrink-0">{creatorInitial}</div>
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-[13px] font-medium text-card-foreground truncate">{creatorName}</span>
            <span className="text-[11px] text-white/55">
              {t("organizer" as any)}{creatorRole !== "user" ? ` · ${t(creatorRole)}` : ""}
            </span>
          </div>
        </div>
        
        <Button 
          variant={getButtonVariant()} 
          size="pill"
          onClick={handleButtonClick}
          className={`flex-shrink-0 text-xs ${isPending ? "bg-warning/20 text-warning border-warning/30" : isJoined ? "bg-success/20 text-success border-success/30" : ""}`}
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
};
