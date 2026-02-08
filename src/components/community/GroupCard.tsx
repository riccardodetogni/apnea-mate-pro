import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { CheckCircle, Award, Clock, Building2 } from "lucide-react";

interface GroupCardProps {
  id?: string;
  name: string;
  initial: string;
  memberCount: number;
  activityType: string;
  tags: string[];
  distanceKm?: number;
  isMember?: boolean;
  isPending?: boolean;
  isVerified?: boolean;
  isInstructorLed?: boolean;
  groupType?: string;
  onJoin?: () => void;
  onViewProfile?: () => void;
}

export const GroupCard = ({
  name,
  initial,
  memberCount,
  activityType,
  tags,
  distanceKm,
  isMember = false,
  isPending = false,
  isVerified = false,
  isInstructorLed = false,
  groupType = 'community',
  onJoin,
  onViewProfile,
}: GroupCardProps) => {
  // Determine badge type based on verified status and group type
  const getBadge = () => {
    if (isVerified) {
      if (groupType === 'scuola_club') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/85 border border-white/10">
            <Building2 className="w-3 h-3" />
            Scuola partner
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success border border-success/20">
          <CheckCircle className="w-3 h-3" />
          {t("verifiedClub")}
        </span>
      );
    }
    if (isInstructorLed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning border border-warning/20">
          <Award className="w-3 h-3" />
          {t("instructor")}
        </span>
      );
    }
    return null;
  };

  return (
    <div 
      className="card-group min-w-[260px] animate-fade-in cursor-pointer transition-all hover:scale-[1.02]"
      onClick={onViewProfile}
    >
      {/* Top - avatar and info */}
      <div className="flex items-center gap-2.5">
        <div className="avatar-group">{initial}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[15px] font-semibold text-white/92 truncate">{name}</h3>
            {isVerified && (
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            )}
          </div>
          <p className="text-[13px] text-white/55">{memberCount} {t("members")} · {activityType}</p>
        </div>
      </div>

      {/* Badges */}
      {getBadge() && (
        <div className="flex flex-wrap gap-1.5">
          {getBadge()}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span key={index} className="badge-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Action button */}
      <div className="flex gap-2 mt-1.5" onClick={e => e.stopPropagation()}>
        {isMember ? (
          <Button variant="outline" size="sm" disabled className="border-white/15 text-white/60">
            Membro
          </Button>
        ) : isPending ? (
          <Button variant="outline" size="sm" disabled className="gap-1.5 border-white/15 text-white/60">
            <Clock className="w-3.5 h-3.5" />
            In attesa
          </Button>
        ) : onJoin ? (
          <Button variant="pill" size="sm" onClick={onJoin}>
            {t("joinGroup")}
          </Button>
        ) : null}
      </div>

      {/* Distance */}
      {distanceKm !== undefined && (
        <p className="text-xs text-white/55 mt-0.5">
          {t("distanceAway")} {distanceKm} {t("km")}
        </p>
      )}
    </div>
  );
};
