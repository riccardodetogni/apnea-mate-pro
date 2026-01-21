import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { SearchBar } from "@/components/community/SearchBar";
import { SectionHeader } from "@/components/community/SectionHeader";
import { SessionCard } from "@/components/community/SessionCard";
import { GroupCard } from "@/components/community/GroupCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { SafetyWarningModal } from "@/components/community/SafetyWarningModal";
import { useSessions, useSessionsFromFollowing, SessionWithDetails } from "@/hooks/useSessions";
import { useGroups, GroupWithDetails } from "@/hooks/useGroups";
import { useSearch } from "@/hooks/useSearch";
import { useCommunityContext } from "@/hooks/useCommunityContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Community = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Community context with user info, location, and permissions
  const {
    user,
    loading: contextLoading,
    isCertified,
    filters,
    toggleNearbyFilter,
    canJoinSession,
    isWithinRadius,
    getDistanceKm,
  } = useCommunityContext();

  // Data hooks
  const { 
    sessions, 
    rawSessions,
    loading: sessionsLoading, 
    joinSession,
    refetch: refetchSessions,
  } = useSessions({ excludeJoined: false });
  
  const { 
    sessions: followingSessions, 
    rawSessions: rawFollowingSessions,
    loading: followingLoading,
    joinSession: joinFollowingSession,
    refetch: refetchFollowingSessions,
  } = useSessionsFromFollowing();
  
  const { 
    groups, 
    loading: groupsLoading, 
    joinGroup,
    refetch: refetchGroups,
  } = useGroups();
  
  const { 
    search, 
    results, 
    loading: searchLoading, 
    hasResults, 
    query,
    clearSearch 
  } = useSearch();

  // Local state
  const [joiningSession, setJoiningSession] = useState<string | null>(null);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const [safetyModal, setSafetyModal] = useState<{
    open: boolean;
    session: SessionWithDetails | null;
    fromFollowing: boolean;
  }>({ open: false, session: null, fromFollowing: false });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!contextLoading && !user) {
      navigate("/auth");
    }
  }, [user, contextLoading, navigate]);

  // Refresh data when returning from child pages
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchSessions();
        refetchFollowingSessions();
        refetchGroups();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchSessions, refetchFollowingSessions, refetchGroups]);

  // Also refresh on route change back to community
  useEffect(() => {
    if (location.pathname === '/community') {
      refetchSessions();
      refetchFollowingSessions();
      refetchGroups();
    }
  }, [location.pathname, refetchSessions, refetchFollowingSessions, refetchGroups]);

  // Handle session join with safety check
  const handleJoinSession = useCallback((session: SessionWithDetails, fromFollowing = false) => {
    const { requiresWarning } = canJoinSession(session.rawLevel);
    
    if (requiresWarning) {
      setSafetyModal({ open: true, session, fromFollowing });
    } else {
      // Show safety warning for all sessions (safety-first)
      setSafetyModal({ open: true, session, fromFollowing });
    }
  }, [canJoinSession]);

  // Confirm join after safety acknowledgement
  const confirmJoinSession = async () => {
    if (!safetyModal.session) return;
    
    setJoiningSession(safetyModal.session.id);
    
    const joinFn = safetyModal.fromFollowing ? joinFollowingSession : joinSession;
    const { error } = await joinFn(safetyModal.session.id);
    
    setJoiningSession(null);
    setSafetyModal({ open: false, session: null, fromFollowing: false });
    
    if (error) {
      // Check for specific errors
      if (error.message?.includes('duplicate')) {
        toast({
          title: "Già iscritto",
          description: "Sei già iscritto a questa sessione",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile unirsi alla sessione",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Iscritto!",
        description: "Ti sei unito alla sessione. Buona immersione!",
      });
    }
  };

  const handleJoinGroup = async (group: GroupWithDetails) => {
    if (group.requiresApproval) {
      toast({
        title: "Richiesta inviata",
        description: "L'amministratore del gruppo valuterà la tua richiesta",
      });
      // TODO: Implement request-based join
      return;
    }

    setJoiningGroup(group.id);
    const { error } = await joinGroup(group.id);
    setJoiningGroup(null);
    
    if (error) {
      if (error.message?.includes('duplicate')) {
        toast({
          title: "Già membro",
          description: "Sei già membro di questo gruppo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile unirsi al gruppo",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Iscritto!",
        description: "Ti sei unito al gruppo",
      });
    }
  };

  const handleSearch = useCallback((query: string) => {
    search(query);
  }, [search]);

  const handleSessionClick = (sessionId: string) => {
    // TODO: Navigate to session details page
    // navigate(`/sessions/${sessionId}`);
  };

  const handleGroupClick = (groupId: string) => {
    // TODO: Navigate to group page
    // navigate(`/groups/${groupId}`);
  };

  const handleProfileClick = (userId: string) => {
    // TODO: Navigate to user profile
    // navigate(`/profile/${userId}`);
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter and sort sessions

  // Filter and sort sessions
  const getFilteredSortedSessions = (sessionsList: typeof sessions, rawSessionsList: typeof rawSessions) => {
    // Map formatted sessions to their raw data for location info
    const rawMap = new Map(rawSessionsList.map(s => [s.id, s]));
    
    // Add distance info to each session
    const withDistance = sessionsList
      .filter(s => !s.isJoined)
      .map(s => {
        const raw = rawMap.get(s.id);
        const lat = raw?.spot?.latitude ?? null;
        const lon = raw?.spot?.longitude ?? null;
        const distance = getDistanceKm(lat, lon);
        return { ...s, distanceKm: distance, lat, lon };
      });

    // Apply radius filter only if nearbyOnly is enabled
    const filtered = filters.nearbyOnly 
      ? withDistance.filter(s => isWithinRadius(s.lat, s.lon))
      : withDistance;

    // Sort by distance (if available), then by date
    return filtered.sort((a, b) => {
      // Sessions with known distance come first
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0; // Keep original order (by date from query)
    });
  };

  const availableSessions = getFilteredSortedSessions(sessions, rawSessions);
  const availableFollowingSessions = getFilteredSortedSessions(followingSessions, rawFollowingSessions);
  const availableGroups = groups.filter(g => !g.isMember);

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
        nearbyFilterActive={filters.nearbyOnly}
        onToggleNearbyFilter={toggleNearbyFilter}
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
              <button
                key={s.id}
                onClick={() => handleSessionClick(s.id)}
                className="w-full text-left text-sm p-2 bg-background rounded-lg hover:bg-secondary transition-colors"
              >
                📅 {s.title}
              </button>
            ))}
            {results.groups.map(g => (
              <button
                key={g.id}
                onClick={() => handleGroupClick(g.id)}
                className="w-full text-left text-sm p-2 bg-background rounded-lg hover:bg-secondary transition-colors"
              >
                👥 {g.name}
              </button>
            ))}
            {results.spots.map(s => (
              <div key={s.id} className="text-sm p-2 bg-background rounded-lg">
                📍 {s.name} - {s.location}
              </div>
            ))}
            {results.profiles.map(p => (
              <button
                key={p.id}
                onClick={() => handleProfileClick(p.id)}
                className="w-full text-left text-sm p-2 bg-background rounded-lg hover:bg-secondary transition-colors"
              >
                👤 {p.name}
              </button>
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
        ) : availableSessions.length > 0 ? (
          availableSessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              showJoinButton={!session.isFull && !session.isJoined}
              onJoin={() => handleJoinSession(session, false)}
              onDetails={() => handleSessionClick(session.id)}
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
          ) : availableFollowingSessions.length > 0 ? (
            availableFollowingSessions.map((session) => (
              <SessionCard
                key={session.id}
                {...session}
                showJoinButton={!session.isFull && !session.isJoined}
                onJoin={() => handleJoinSession(session, true)}
                onDetails={() => handleSessionClick(session.id)}
              />
            ))
          ) : (
            <EmptyCard
              message={t("noMoreSessions")}
              actionLabel={t("exploreFreedivers")}
              onAction={() => navigate("/profile")}
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
          ) : availableGroups.length > 0 ? (
            availableGroups.map((group) => (
              <GroupCard
                key={group.id}
                {...group}
                onJoin={() => handleJoinGroup(group)}
              />
            ))
          ) : groups.length > 0 ? (
            <EmptyCard
              message="Sei già membro di tutti i gruppi!"
              actionLabel="Crea un gruppo"
              onAction={() => navigate("/create")}
            />
          ) : (
            <EmptyCard
              message="Nessun gruppo disponibile."
              actionLabel="Crea un gruppo"
              onAction={() => navigate("/create")}
            />
          )}
        </div>
      </div>

      {/* Safety Warning Modal */}
      <SafetyWarningModal
        open={safetyModal.open}
        onClose={() => setSafetyModal({ open: false, session: null, fromFollowing: false })}
        onConfirm={confirmJoinSession}
        sessionTitle={safetyModal.session?.title || ""}
        sessionLevel={safetyModal.session?.rawLevel || "all_levels"}
        userCertified={isCertified}
        loading={!!joiningSession}
      />
    </AppLayout>
  );
};

export default Community;
