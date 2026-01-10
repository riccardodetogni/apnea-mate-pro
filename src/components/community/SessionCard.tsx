import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

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
  showJoinButton?: boolean;
  onJoin?: () => void;
  onDetails?: () => void;
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
  showJoinButton = true,
  onJoin,
  onDetails,
}: SessionCardProps) => {
  return (
    <div className="card-session min-w-[260px] animate-fade-in">
      {/* Top section - tags and meta */}
      <div className="flex flex-col gap-0.5 text-xs text-muted">
        <div className="flex gap-1.5 flex-wrap">
          <span className="chip-session">{spotName} · {environmentType}</span>
          <span className="chip-session">{sessionType}</span>
        </div>
        <div className="text-xs text-muted mt-1">{dateTime}</div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap mt-0.5">
        <span className="badge-level">{t(levelLabels[level])}</span>
        <span className="badge-spots">{spotsAvailable}/{spotsTotal} {t("spots")}</span>
      </div>

      {/* Bottom - creator and action */}
      <div className="flex justify-between items-center mt-1 gap-2.5">
        <div className="flex items-center gap-2">
          <div className="avatar-creator">{creatorInitial}</div>
          <div className="flex flex-col gap-px">
            <span className="text-[13px] font-medium text-foreground">{creatorName}</span>
            <span className="text-[11px] text-muted">{t(creatorRole)}</span>
          </div>
        </div>
        
        {showJoinButton ? (
          <Button variant="pill" onClick={onJoin}>
            {t("join")}
          </Button>
        ) : (
          <Button variant="pillOutline" onClick={onDetails}>
            {t("details")}
          </Button>
        )}
      </div>
    </div>
  );
};
