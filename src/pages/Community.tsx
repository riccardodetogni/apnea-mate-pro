import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { SearchBar } from "@/components/community/SearchBar";
import { SectionHeader } from "@/components/community/SectionHeader";
import { SessionCard } from "@/components/community/SessionCard";
import { GroupCard } from "@/components/community/GroupCard";
import { EventCard } from "@/components/community/EventCard";
import { CourseCard } from "@/components/community/CourseCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { SafetyWarningModal } from "@/components/community/SafetyWarningModal";
import { SessionFilters, SessionFilterState, defaultSessionFilters } from "@/components/community/SessionFilters";
import { useSessions, useSessionsFromFollowing, SessionWithDetails } from "@/hooks/useSessions";
import { useGroups, GroupWithDetails } from "@/hooks/useGroups";
import { useEvents } from "@/hooks/useEvents";
import { useCourses } from "@/hooks/useCourses";
import { useSearch } from "@/hooks/useSearch";
import { useCommunityContext } from "@/hooks/useCommunityContext";
import { useVerifiedGroups } from "@/hooks/useVerifiedGroups";
import { useProfile } from "@/hooks/useProfile";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, addWeeks, isWithinInterval } from "date-fns";

const Community = () => {
  const navigate = useNavigate();
  
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

  const { events, loading: eventsLoading } = useEvents();
  const { courses, loading: coursesLoading } = useCourses();
  
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
  const [sessionFilters, setSessionFilters] = useState<SessionFilterState>(defaultSessionFilters);
  const [safetyModal, setSafetyModal] = useState<{
    open: boolean;
    session: SessionWithDetails | null;
    fromFollowing: boolean;
  }>({ open: false, session: null, fromFollowing: false });

  // React Query handles refetchOnWindowFocus automatically

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
      if (error.message?.includes('duplicate')) {
        toast({
          title: t("alreadyJoined"),
          description: t("alreadyJoinedDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("error"),
          description: t("cannotJoinSession"),
          variant: "destructive",
        });
      }
    } else {
      const isCreator = safetyModal.session?.creatorId === user?.id;
      toast({
        title: isCreator ? t("youJoined") : t("requestSent"),
        description: isCreator 
          ? t("youJoinedDesc")
          : t("requestSentDesc"),
      });
    }
  };

  const handleJoinGroup = async (group: GroupWithDetails) => {
    setJoiningGroup(group.id);
    const { error, isPending } = await joinGroup(group.id);
    setJoiningGroup(null);
    
    if (error) {
      if (error.message?.includes('duplicate')) {
        toast({
          title: t("alreadyMember"),
          description: t("alreadyMemberDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("error"),
          description: t("cannotJoinGroup"),
          variant: "destructive",
        });
      }
    } else if (isPending) {
      toast({
        title: t("requestSentCommunity"),
        description: t("adminWillEvaluate"),
      });
    } else {
      toast({
        title: t("subscribedGroup"),
        description: t("joinedGroupDesc"),
      });
    }
  };

  const handleSearch = useCallback((query: string) => {
    search(query);
  }, [search]);

  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`, { state: { from: '/community' } });
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`, { state: { from: '/community' } });
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/users/${userId}`, { state: { from: '/community' } });
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

  // Filter and sort sessions (keep all sessions, don't filter out joined)
  const getFilteredSortedSessions = (sessionsList: typeof sessions, rawSessionsList: typeof rawSessions) => {
    // Map formatted sessions to their raw data for location info
    const rawMap = new Map(rawSessionsList.map(s => [s.id, s]));
    
    // Add distance info to each session (don't filter out joined sessions)
    const withDistance = sessionsList.map(s => {
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

  // Apply session filters
  const applySessionFilters = (list: typeof availableSessions) => {
    let result = list;

    // Date filter
    if (sessionFilters.dateRange !== "all") {
      const now = new Date();
      const today = startOfDay(now);
      let from: Date | undefined;
      let to: Date | undefined;

      switch (sessionFilters.dateRange) {
        case "today":
          from = today;
          to = endOfDay(now);
          break;
        case "tomorrow":
          from = startOfDay(addDays(now, 1));
          to = endOfDay(addDays(now, 1));
          break;
        case "thisWeek":
          from = startOfWeek(now, { weekStartsOn: 1 });
          to = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "nextWeek":
          from = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
          to = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
          break;
        case "custom":
          from = sessionFilters.customFrom ? startOfDay(sessionFilters.customFrom) : undefined;
          to = sessionFilters.customTo ? endOfDay(sessionFilters.customTo) : undefined;
          break;
      }

      if (from || to) {
        result = result.filter((s) => {
          const sDate = new Date(s.rawDateTime);
          if (from && to) return isWithinInterval(sDate, { start: from, end: to });
          if (from) return sDate >= from;
          if (to) return sDate <= to;
          return true;
        });
      }
    }

    // Spot filter
    if (sessionFilters.spotName) {
      result = result.filter((s) => s.spotName === sessionFilters.spotName);
    }

    // Paid filter
    if (sessionFilters.paidFilter === "free") {
      result = result.filter((s) => !s.isPaid);
    } else if (sessionFilters.paidFilter === "paid") {
      result = result.filter((s) => s.isPaid);
    }

    return result;
  };

  const filteredSessions = applySessionFilters(availableSessions);

  const myGroups = groups.filter(g => g.isMember);
  const availableGroups = groups.filter(g => !g.isMember && !g.isPending);

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
            <h3 className="font-semibold text-foreground">{t("resultsFor")} "{query}"</h3>
            <button 
              onClick={clearSearch}
              className="text-sm text-muted hover:text-foreground"
            >
              {t("close")}
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
                onClick={() => handleProfileClick(p.user_id)}
                className="w-full text-left text-sm p-2 bg-background rounded-lg hover:bg-secondary transition-colors"
              >
                👤 {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sessions for you */}
      <SectionHeader 
        title={t("sessionsForYou")}
        actionLabel={t("viewAll")}
        onAction={() => navigate("/spots")}
      />
      <SessionFilters
        sessions={availableSessions}
        filters={sessionFilters}
        onFiltersChange={setSessionFilters}
      />
      <div className="scroll-row">
        {sessionsLoading ? (
          <>
            <SessionSkeleton />
            <SessionSkeleton />
          </>
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              showJoinButton={!session.isFull && !session.isJoined && !session.isPending}
              onJoin={() => handleJoinSession(session, false)}
              onDetails={() => handleSessionClick(session.id)}
              onClick={() => handleSessionClick(session.id)}
            />
          ))
        ) : filters.nearbyOnly ? (
          <EmptyCard
            message={t("noSessionNearby").replace("{radius}", String(filters.radiusKm))}
            actionLabel={t("showAll")}
            onAction={toggleNearbyFilter}
          />
        ) : (
          <EmptyCard
            message={t("noSessionsAvailable")}
            actionLabel={t("createASession")}
            onAction={() => navigate("/create/session")}
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
                showJoinButton={!session.isFull && !session.isJoined && !session.isPending}
                onJoin={() => handleJoinSession(session, true)}
                onDetails={() => handleSessionClick(session.id)}
                onClick={() => handleSessionClick(session.id)}
              />
            ))
          ) : (
            <EmptyCard
              message={t("noMoreSessions")}
              actionLabel={t("exploreFreedivers")}
              onAction={() => navigate("/discover")}
            />
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mt-4">
        <SectionHeader 
          title={t("upcomingEvents")} 
          actionLabel={t("viewAll")}
          onAction={() => {}}
        />
        <div className="scroll-row">
          {eventsLoading ? (
            <>
              <Skeleton className="min-w-[280px] h-[180px] rounded-2xl" />
              <Skeleton className="min-w-[280px] h-[180px] rounded-2xl" />
            </>
          ) : events.length > 0 ? (
            events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/events/${event.id}`)}
              />
            ))
          ) : (
            <EmptyCard
              message={t("noEvents")}
              actionLabel={t("createEvent")}
              onAction={() => navigate("/create/event")}
            />
          )}
        </div>
      </div>

      {/* Available Courses */}
      <div className="mt-4">
        <SectionHeader 
          title={t("availableCoursesSection")} 
          actionLabel={t("viewAll")}
          onAction={() => {}}
        />
        <div className="scroll-row">
          {coursesLoading ? (
            <>
              <Skeleton className="min-w-[280px] h-[180px] rounded-2xl" />
              <Skeleton className="min-w-[280px] h-[180px] rounded-2xl" />
            </>
          ) : courses.length > 0 ? (
            courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/courses/${course.id}`)}
              />
            ))
          ) : (
            <EmptyCard
              message={t("noCourses")}
              actionLabel={t("createCourse")}
              onAction={() => navigate("/create/course")}
            />
          )}
        </div>
      </div>

      {/* Your groups */}
      {myGroups.length > 0 && (
        <div className="mt-4">
          <SectionHeader 
            title={t("yourGroups")} 
            actionLabel={t("viewAllGroups")}
            onAction={() => navigate("/groups")}
          />
          <div className="scroll-row">
            {myGroups.map((group) => (
              <GroupCard
                key={group.id}
                {...group}
                onViewProfile={() => handleGroupClick(group.id)}
              />
            ))}
          </div>
        </div>
      )}

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
                onJoin={!group.isMember && !group.isPending ? () => handleJoinGroup(group) : undefined}
                onViewProfile={() => handleGroupClick(group.id)}
              />
            ))
          ) : (
            <EmptyCard
              message={myGroups.length > 0 ? t("noOtherGroups") : t("noGroupsAvailable")}
              actionLabel={t("createAGroup")}
              onAction={() => navigate("/create/group")}
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
