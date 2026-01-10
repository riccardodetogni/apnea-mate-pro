import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface GroupCardProps {
  name: string;
  initial: string;
  memberCount: number;
  activityType: string;
  tags: string[];
  distanceKm: number;
  onJoin?: () => void;
}

export const GroupCard = ({
  name,
  initial,
  memberCount,
  activityType,
  tags,
  distanceKm,
  onJoin,
}: GroupCardProps) => {
  return (
    <div className="card-group min-w-[260px] animate-fade-in">
      {/* Top - avatar and info */}
      <div className="flex items-center gap-2.5">
        <div className="avatar-group">{initial}</div>
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">{name}</h3>
          <p className="text-[13px] text-muted">{memberCount} {t("members")} · {activityType}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, index) => (
          <span key={index} className="badge-tag">{tag}</span>
        ))}
      </div>

      {/* Action button */}
      <Button variant="pill" className="mt-1.5" onClick={onJoin}>
        {t("joinGroup")}
      </Button>

      {/* Distance */}
      <p className="text-xs text-muted mt-0.5">
        {t("distanceAway")} {distanceKm} {t("km")}
      </p>
    </div>
  );
};
