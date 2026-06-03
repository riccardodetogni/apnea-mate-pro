import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SessionCard } from "@/components/community/SessionCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/useSessions";
import { t } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";

const AllSessions = () => {
  const navigate = useNavigate();
  const { sessions, loading } = useSessions({ excludeJoined: false });

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
        <h1 className="text-xl font-bold text-foreground">{t("sessionsForYou")}</h1>
      </div>

      <div className="flex flex-col gap-3 [&_.card-session]:!min-w-0 [&_.card-session]:!max-w-none [&_.card-session]:w-full">
        {loading ? (
          <>
            <Skeleton className="h-[200px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
          </>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
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
            message={t("noSessionsAvailable")}
            actionLabel={t("createASession")}
            onAction={() => navigate("/create/session")}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default AllSessions;