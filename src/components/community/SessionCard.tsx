import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { Check, Clock, DollarSign, BadgeCheck } from "lucide-react";

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
  groupName?: string | null;
  groupAvatar?: string | null;
  groupVerified?: boolean;
  isJoined?: boolean;
  isPaid?: boolean;
  isPending?: boolean;
  isFull?: boolean;
  showJoinButton?: boolean;
  onJoin?: () => void;
  onDetails?: () => void;
  onClick?: () => void;
  coverImageUrl?: string | null;
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
  groupName,
  groupAvatar,
  groupVerified,
  isJoined = false,
  isPaid = false,
  isPending = false,
  isFull = false,
  showJoinButton = true,
  onJoin,
  onDetails,
  onClick,
  coverImageUrl,
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
          {t("waitingBadge")}
        </>
      );
    }
    if (isJoined) {
      return (
        <>
          <Check className="w-3.5 h-3.5" />
          {t("joinedBadge")}
        </>
      );
    }
    if (isFull) {
      return t("fullShort");
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

  const hasCover = !!coverImageUrl;
  const chipClass = hasCover ? "chip-solid" : "chip-session";
  const softText = hasCover ? "text-white/85 cover-text-shadow" : "text-white/55";
  const titleText = hasCover ? "text-white cover-text-shadow" : "text-card-foreground";
  const nameText = hasCover ? "text-white cover-text-shadow" : "text-card-foreground";

  return (
    <div 
      className={`card-session min-w-[260px] animate-fade-in cursor-pointer transition-all hover:scale-[1.02] ${hasCover ? "has-cover min-h-[210px]" : ""}`}
      onClick={handleCardClick}
    >
      {hasCover && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none brightness-[0.85] saturate-[0.9]"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[40%] z-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[70%] z-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pointer-events-none"
          />
        </>
      )}
      {/* Top section - tags and meta */}
      <div className="flex flex-col gap-0.5 text-xs">
        <div className="flex gap-1.5 flex-wrap">
          <span className={chipClass}>{spotName} · {environmentType}</span>
          <span className={hasCover ? "chip-solid-accent bg-primary" : "chip-session"}>{sessionType}</span>
        </div>
        <div className={`text-xs mt-1 ${softText}`}>{dateTime}</div>
      </div>

      {/* Title */}
      <h3 className={`text-base font-semibold ${titleText}`}>
        {hasCover ? (
          <span className="bg-black/55 box-decoration-clone px-1.5 py-0.5 rounded-md">{title}</span>
        ) : title}
      </h3>

      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap mt-0.5">
        <span className={hasCover ? "chip-solid" : "badge-level"}>{t(levelLabels[level])}</span>
        <span className={`${hasCover ? "chip-solid" : "badge-spots"} ${isFull ? "!bg-destructive !text-destructive-foreground" : ""}`}>
          {isFull ? t("fullShort") : `${spotsAvailable} ${t("spotsFree")}`}
        </span>
        {isPaid && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${hasCover ? "bg-amber-500 text-white" : "bg-amber-500/15 text-amber-400"}`}>
            <DollarSign className="w-3 h-3" />
            {t("paidSession")}
          </span>
        )}
      </div>

      {/* Bottom - creator and action */}
      <div className="flex justify-between items-center mt-1 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {groupName ? (
            <>
              <div className={`avatar-creator flex-shrink-0 overflow-hidden ${hasCover ? "ring-2 ring-white/80 shadow-md" : ""}`}>
                {groupAvatar ? (
                  <img src={groupAvatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  groupName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col gap-px min-w-0">
                <span className={`text-[13px] font-medium truncate flex items-center gap-1 ${nameText}`}>
                  {groupName}
                  {groupVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </span>
                <span className={`text-[11px] ${softText}`}>{t("organizer" as any)}</span>
              </div>
            </>
          ) : (
            <>
              <div className={`avatar-creator flex-shrink-0 ${hasCover ? "ring-2 ring-white/80 shadow-md" : ""}`}>{creatorInitial}</div>
              <div className="flex flex-col gap-px min-w-0">
                <span className={`text-[13px] font-medium truncate ${nameText}`}>{creatorName}</span>
                <span className={`text-[11px] ${softText}`}>
                  {t("organizer" as any)}{creatorRole !== "user" ? ` · ${t(creatorRole)}` : ""}
                </span>
              </div>
            </>
          )}
        </div>
        
        <Button 
          variant={getButtonVariant()} 
          size="pill"
          onClick={handleButtonClick}
          disabled={isFull && !isJoined && !isPending}
          className={`flex-shrink-0 text-xs ${isPending ? "bg-warning/20 text-warning border-warning/30" : isJoined ? "bg-success/20 text-success border-success/30" : isFull ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
};
