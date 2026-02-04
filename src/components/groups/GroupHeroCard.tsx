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
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/30 rounded-full blur-2xl" />
      </div>

      <div className="relative p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              initial
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground mb-1 truncate">{name}</h1>
            
            <div className="flex items-center gap-1.5 text-muted text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{memberCount} {t("members")}</span>
              </div>
              <span className="text-border">·</span>
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
              {t("groupTypeSchool")}
            </span>
          )}
          {groupType === "community" && !isInstructorLed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground text-xs font-medium">
              {t("spontaneousGroup")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
