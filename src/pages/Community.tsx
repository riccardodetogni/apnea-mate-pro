import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { SearchBar } from "@/components/community/SearchBar";
import { SectionHeader } from "@/components/community/SectionHeader";
import { SessionCard } from "@/components/community/SessionCard";
import { GroupCard } from "@/components/community/GroupCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useSessionsFromFollowing } from "@/hooks/useSessions";
import { useGroups } from "@/hooks/useGroups";
import { useSearch } from "@/hooks/useSearch";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Community = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    sessions, 
    loading: sessionsLoading, 
    joinSession, 
    leaveSession 
  } = useSessions();
  
  const { 
    sessions: followingSessions, 
    loading: followingLoading 
  } = useSessionsFromFollowing();
  
  const { 
    groups, 
    loading: groupsLoading, 
    joinGroup 
  } = useGroups();
  
  const { 
    search, 
    results, 
    loading: searchLoading, 
    hasResults, 
    query,
    clearSearch 
  } = useSearch();

  const [joiningSession, setJoiningSession] = useState<string | null>(null);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleJoinSession = async (sessionId: string) => {
    setJoiningSession(sessionId);
    const { error } = await joinSession(sessionId);
    setJoiningSession(null);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile unirsi alla sessione",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Iscritto!",
        description: "Ti sei unito alla sessione",
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroup(groupId);
    const { error } = await joinGroup(groupId);
    setJoiningGroup(null);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile unirsi al gruppo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Iscritto!",
        description: "Ti sei unito al gruppo",
      });
    }
  };

  const handleSearch = (query: string) => {
    search(query);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const SessionSkeleton = () => (
    <div className="min-w-[280px] max-w-[280px] rounded-2xl border border-border p-4 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );

  const GroupSkeleton = () => (
    <div className="min-w-[200px] max-w-[200px] rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      {/* Header */}
      <CommunityHeader />

      {/* Search */}
      <SearchBar 
        onSearch={handleSearch}
        loading={searchLoading}
      />

      {/* Search Results */}
      {query && hasResults && (
        <div className="mb-6 p-4 bg-secondary rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Risultati per "{query}"</h3>
            <button 
              onClick={clearSearch}
              className="text-sm text-muted hover:text-foreground"
            >
              Chiudi
            </button>
          </div>
          <div className="space-y-2">
            {results.sessions.map(s => (
              <div key={s.id} className="text-sm p-2 bg-background rounded-lg">
                📅 {s.title}
              </div>
            ))}
            {results.groups.map(g => (
              <div key={g.id} className="text-sm p-2 bg-background rounded-lg">
                👥 {g.name}
              </div>
            ))}
            {results.spots.map(s => (
              <div key={s.id} className="text-sm p-2 bg-background rounded-lg">
                📍 {s.name} - {s.location}
              </div>
            ))}
            {results.profiles.map(p => (
              <div key={p.id} className="text-sm p-2 bg-background rounded-lg">
                👤 {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions near you */}
      <SectionHeader 
        title={t("sessionsNearYou")} 
        actionLabel={t("viewAll")}
        onAction={() => navigate("/spots")}
      />
      <div className="scroll-row">
        {sessionsLoading ? (
          <>
            <SessionSkeleton />
            <SessionSkeleton />
          </>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              showJoinButton={!session.isJoined && session.spotsAvailable > 0}
              onJoin={() => handleJoinSession(session.id)}
            />
          ))
        ) : (
          <EmptyCard
            message="Nessuna sessione disponibile vicino a te."
            actionLabel="Crea una sessione"
            onAction={() => navigate("/create")}
          />
        )}
      </div>

      {/* From people you follow */}
      <div className="mt-4">
        <SectionHeader 
          title={t("fromPeopleYouFollow")} 
          actionLabel={t("viewAll")}
          onAction={() => {}}
        />
        <div className="scroll-row">
          {followingLoading ? (
            <>
              <SessionSkeleton />
              <SessionSkeleton />
            </>
          ) : followingSessions.length > 0 ? (
            followingSessions.map((session) => (
              <SessionCard
                key={session.id}
                {...session}
                showJoinButton={true}
                onJoin={() => handleJoinSession(session.id)}
              />
            ))
          ) : (
            <EmptyCard
              message={t("noMoreSessions")}
              actionLabel={t("exploreFreedivers")}
              onAction={() => {}}
            />
          )}
        </div>
      </div>

      {/* Groups near you */}
      <div className="mt-4">
        <SectionHeader 
          title={t("groupsNearYou")} 
          actionLabel={t("viewAllGroups")}
          onAction={() => navigate("/groups")}
        />
        <div className="scroll-row">
          {groupsLoading ? (
            <>
              <GroupSkeleton />
              <GroupSkeleton />
            </>
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                {...group}
                onJoin={!group.isMember ? () => handleJoinGroup(group.id) : undefined}
              />
            ))
          ) : (
            <EmptyCard
              message="Nessun gruppo disponibile."
              actionLabel="Crea un gruppo"
              onAction={() => navigate("/create")}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Community;
