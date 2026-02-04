import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { GroupCard } from "@/components/community/GroupCard";
import { GroupFilterChips, GroupFilter } from "@/components/groups/GroupFilterChips";
import { SectionHeader } from "@/components/community/SectionHeader";
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
      toast({ title: "Devi accedere per unirti", variant: "destructive" });
      return;
    }
    const { error } = await joinGroup(groupId);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Iscrizione effettuata!" });
    }
  };

  // Filter groups based on selected filter and search
  const filteredGroups = useMemo(() => {
    let result = groups;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.activityType.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (filter) {
      case "schools":
        result = result.filter(g => g.isInstructorLed);
        break;
      case "myGroups":
        result = result.filter(g => g.isMember);
        break;
      case "nearby":
        // For now, show all - would need geolocation
        break;
    }

    return result;
  }, [groups, filter, searchQuery]);

  // Separate into sections
  const certifiedGroups = filteredGroups.filter(g => g.isInstructorLed);
  const myGroups = filteredGroups.filter(g => g.isMember);
  const popularGroups = filteredGroups
    .filter(g => !g.isMember && !g.isInstructorLed)
    .sort((a, b) => b.memberCount - a.memberCount);

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
          Crea
        </Button>
      </header>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t("searchGroupsPlaceholder")}
          className="pl-9 bg-card"
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
          <p className="text-muted">Nessun gruppo trovato</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Certified Schools Section */}
          {filter === "all" && certifiedGroups.length > 0 && (
            <section>
              <SectionHeader title={t("schoolClubCertified")} />
              <div className="space-y-3">
                {certifiedGroups.map(group => (
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
                      isVerified
                      onViewProfile={() => navigate(`/groups/${group.id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My Groups Section */}
          {(filter === "all" || filter === "myGroups") && myGroups.length > 0 && (
            <section>
              <SectionHeader title={t("yourGroups")} />
              <div className="space-y-3">
                {myGroups.map(group => (
                  <div key={group.id} className="animate-fade-in">
                    <GroupCard
                      id={group.id}
                      name={group.name}
                      initial={group.initial}
                      memberCount={group.memberCount}
                      activityType={group.activityType}
                      tags={group.tags}
                      distanceKm={group.distanceKm}
                      isMember
                      onViewProfile={() => navigate(`/groups/${group.id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Groups Section */}
          {(filter === "all" || filter === "nearby") && popularGroups.length > 0 && (
            <section>
              <SectionHeader title={t("popularGroups")} />
              <div className="space-y-3">
                {popularGroups.map(group => (
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
                      onJoin={() => handleJoinGroup(group.id)}
                      onViewProfile={() => navigate(`/groups/${group.id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Schools filter - show all certified */}
          {filter === "schools" && certifiedGroups.length > 0 && (
            <section>
              <div className="space-y-3">
                {certifiedGroups.map(group => (
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
                      isVerified
                      onJoin={!group.isMember ? () => handleJoinGroup(group.id) : undefined}
                      onViewProfile={() => navigate(`/groups/${group.id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Groups;
