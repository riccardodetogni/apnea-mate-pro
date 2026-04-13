import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { GroupCard } from "@/components/community/GroupCard";
import { GroupFilterChips, GroupFilter } from "@/components/groups/GroupFilterChips";

import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { groups, loading, joinGroup } = useGroups();
  
  const [filter, setFilter] = useState<GroupFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast({ title: t("mustLoginToJoin"), variant: "destructive" });
      return;
    }
    const { error, isPending } = await joinGroup(groupId);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else if (isPending) {
      toast({ title: t("requestSentGroup"), description: t("waitingApprovalGroup") });
    } else {
      toast({ title: t("subscriptionDone") });
    }
  };

  const filteredGroups = useMemo(() => {
    let result = groups;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.activityType.toLowerCase().includes(query)
      );
    }

    switch (filter) {
      case "schools":
        result = result.filter(g => g.isInstructorLed);
        break;
      case "myGroups":
        result = result.filter(g => g.isMember);
        break;
      case "nearby":
        break;
    }

    return result;
  }, [groups, filter, searchQuery]);

  return (
    <AppLayout>
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("navGroups")}</h1>
          <p className="text-sm text-muted mt-0.5">{t("groupsNearYou")}</p>
        </div>
        <Button
          onClick={() => navigate("/create/group")}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {t("create")}
        </Button>
      </header>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t("searchGroupsPlaceholder")}
          className="pl-9"
        />
      </div>

      {/* Filter Chips */}
      <div className="mb-6">
        <GroupFilterChips activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">{t("noGroupsFound")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(group => (
            <div key={group.id} className="animate-fade-in">
              <GroupCard
                id={group.id}
                name={group.name}
                initial={group.initial}
                memberCount={group.memberCount}
                activityType={group.activityType}
                tags={group.tags}
                distanceKm={group.distanceKm}
                isMember={group.isMember}
                isPending={group.isPending}
                isVerified={group.isVerified}
                isInstructorLed={group.isInstructorLed}
                groupType={group.groupType}
                onJoin={!group.isMember && !group.isPending ? () => handleJoinGroup(group.id) : undefined}
                onViewProfile={() => navigate(`/groups/${group.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Groups;