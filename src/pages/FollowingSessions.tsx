import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SessionCard } from "@/components/community/SessionCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionFilters, SessionFilterState, defaultSessionFilters } from "@/components/community/SessionFilters";
import { applySessionFilters } from "@/lib/sessionFilters";
import { useSessionsFromFollowing } from "@/hooks/useSessions";
import { useCommunityContext } from "@/hooks/useCommunityContext";
import { t } from "@/lib/i18n";
import { ArrowLeft, MapPin } from "lucide-react";

const FollowingSessions = () => {
  const navigate = useNavigate();
  const { sessions, rawSessions, loading } = useSessionsFromFollowing();
  const { filters, isWithinRadius, toggleNearbyFilter } = useCommunityContext();
  const [sessionFilters, setSessionFilters] = useState<SessionFilterState>(defaultSessionFilters);

  const rawMap = new Map(rawSessions.map((s) => [s.id, s]));
  const nearbyFiltered = filters.nearbyOnly
    ? sessions.filter((s) => {
        const raw = rawMap.get(s.id);
        return isWithinRadius(raw?.spot?.latitude ?? null, raw?.spot?.longitude ?? null);
      })
    : sessions;
  const filtered = applySessionFilters(nearbyFiltered, sessionFilters);

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("fromPeopleYouFollow")}</h1>
      </div>

      {filters.nearbyOnly && (
        <button
          onClick={toggleNearbyFilter}
          className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t("nearYou")} · {filters.radiusKm} km ✕</span>
        </button>
      )}

      <SessionFilters
        sessions={sessions}
        filters={sessionFilters}
        onFiltersChange={setSessionFilters}
      />

      <div className="flex flex-col gap-3 [&_.card-session]:!min-w-0 [&_.card-session]:!max-w-none [&_.card-session]:w-full">
        {loading ? (
          <>
            <Skeleton className="h-[200px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
          </>
        ) : filtered.length > 0 ? (
          filtered.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              showJoinButton={false}
              onClick={() => navigate(`/sessions/${session.id}`)}
              onDetails={() => navigate(`/sessions/${session.id}`)}
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
    </AppLayout>
  );
};

export default FollowingSessions;