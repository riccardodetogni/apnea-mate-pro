import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "@/lib/i18n";
import { Search, Crown, Shield, User } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface GroupMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  totalCount: number;
  ownerId?: string;
  groupId?: string;
}

const roleConfig = {
  owner: { label: "ownerBadge", icon: Crown, className: "bg-amber-500/10 text-amber-600" },
  admin: { label: "adminBadge", icon: Shield, className: "bg-primary/10 text-primary" },
  member: { label: "memberBadge", icon: User, className: "bg-muted text-muted-foreground" },
};

export const GroupMembersSheet = ({
  open,
  onOpenChange,
  members,
  totalCount,
  ownerId,
  groupId,
}: GroupMembersSheetProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let result = members.filter((m) => m.profile !== null);

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.profile?.name.toLowerCase().includes(query)
      );
    }

    // Sort: owners first, then admins, then members
    result.sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      const aRole = a.user_id === ownerId ? "owner" : a.role;
      const bRole = b.user_id === ownerId ? "owner" : b.role;
      return (roleOrder[aRole as keyof typeof roleOrder] ?? 2) - (roleOrder[bRole as keyof typeof roleOrder] ?? 2);
    });

    return result;
  }, [members, searchQuery, ownerId]);

  const handleMemberClick = (userId: string) => {
    onOpenChange(false);
    navigate(`/users/${userId}`, { state: { from: groupId ? `/groups/${groupId}` : '/groups' } });
  };

  const getMemberRole = (member: Member) => {
    if (member.user_id === ownerId) return "owner";
    if (member.role === "admin") return "admin";
    return "member";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">
            {t("groupMembersTitle")} ({totalCount})
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            type="text"
            placeholder={t("searchMembers")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-10 rounded-full"
          />
        </div>

        {/* Members list */}
        <ScrollArea className="h-[calc(80vh-140px)]">
          <div className="space-y-2 pr-4">
            {filteredMembers.map((member) => {
              const role = getMemberRole(member);
              const config = roleConfig[role];
              const Icon = config.icon;

              return (
                <div
                  key={member.id}
                  onClick={() => handleMemberClick(member.user_id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border cursor-pointer hover:border-primary/30 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-sm font-medium overflow-hidden flex-shrink-0">
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {member.profile?.name || "Unknown"}
                    </p>
                  </div>

                  {/* Role badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
                    <Icon className="w-3 h-3" />
                    {t(config.label as any)}
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted">
                  {searchQuery ? "Nessun membro trovato" : "Nessun membro"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
