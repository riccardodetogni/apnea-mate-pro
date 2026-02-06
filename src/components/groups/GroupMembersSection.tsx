import { t } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  profile: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface GroupMembersSectionProps {
  members: Member[];
  totalCount: number;
  onViewAll?: () => void;
}

export const GroupMembersSection = ({ members, totalCount, onViewAll }: GroupMembersSectionProps) => {
  const displayMembers = members.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{t("membersSection")}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary font-medium flex items-center gap-0.5 hover:underline"
          >
            {t("allMembers")}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        onClick={onViewAll}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center -space-x-2">
          {displayMembers.map((member, index) => (
            <div
              key={member.id}
              className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground overflow-hidden"
              style={{ zIndex: displayMembers.length - index }}
            >
              {member.profile?.avatar_url ? (
                <img
                  src={member.profile.avatar_url}
                  alt={member.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                member.profile?.name?.charAt(0).toUpperCase() || "?"
              )}
            </div>
          ))}
          {totalCount > 6 && (
            <div
              className="w-10 h-10 rounded-full border-2 border-background bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground"
              style={{ zIndex: 0 }}
            >
              +{totalCount - 6}
            </div>
          )}
        </div>

        <p className="text-sm text-muted mt-3">
          {totalCount} {t("members")}
        </p>
      </div>
    </div>
  );
};
