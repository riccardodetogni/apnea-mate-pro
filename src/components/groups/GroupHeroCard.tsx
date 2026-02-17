import { MapPin, Users, CheckCircle, Award } from "lucide-react";
import { t } from "@/lib/i18n";

interface GroupHeroCardProps {
  name: string;
  location: string;
  memberCount: number;
  activityType: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isInstructorLed?: boolean;
  groupType?: string;
}

export const GroupHeroCard = ({
  name,
  location,
  memberCount,
  activityType,
  avatarUrl,
  isVerified,
  isInstructorLed,
  groupType,
}: GroupHeroCardProps) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="card-session !rounded-2xl !p-0">
      <div className="relative z-[1] p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl avatar-gradient flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              initial
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-card-foreground mb-1 truncate">{name}</h1>
            
            <div className="flex items-center gap-1.5 text-[hsl(var(--card-muted))] text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-[hsl(var(--card-muted))]">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{memberCount} {t("members")}</span>
              </div>
              <span className="text-[hsl(var(--card-border))]">·</span>
              <span>{activityType}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              {t("verifiedClub")}
            </span>
          )}
          {isInstructorLed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium">
              <Award className="w-3 h-3" />
              {t("instructor")}
            </span>
          )}
          {groupType === "school" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--badge-blue-bg))] text-card-foreground text-xs font-medium">
              {t("groupTypeSchool")}
            </span>
          )}
          {groupType === "community" && !isInstructorLed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--card-muted))] text-xs font-medium">
              {t("spontaneousGroup")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
