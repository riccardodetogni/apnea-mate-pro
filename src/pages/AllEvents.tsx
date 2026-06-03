import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventCard } from "@/components/community/EventCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeChips, DateRange, isDateInRange } from "@/components/community/DateRangeChips";
import { useEvents } from "@/hooks/useEvents";
import { useVerifiedGroups } from "@/hooks/useVerifiedGroups";
import { useProfile } from "@/hooks/useProfile";
import { t } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";

const AllEvents = () => {
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const { canCreateEventsOrCourses } = useVerifiedGroups();
  const { isAdmin } = useProfile();
  const canCreateEvents = canCreateEventsOrCourses || isAdmin;
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const filtered = events.filter((e) => isDateInRange(e.start_date, dateRange));

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
        <h1 className="text-xl font-bold text-foreground">{t("upcomingEvents")}</h1>
      </div>

      <DateRangeChips value={dateRange} onChange={setDateRange} />

      <div className="flex flex-col gap-3 [&_.card-session]:!min-w-0 [&_.card-session]:!max-w-none [&_.card-session]:w-full">
        {loading ? (
          <>
            <Skeleton className="h-[180px] rounded-2xl" />
            <Skeleton className="h-[180px] rounded-2xl" />
            <Skeleton className="h-[180px] rounded-2xl" />
          </>
        ) : filtered.length > 0 ? (
          filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))
        ) : (
          <EmptyCard
            message={t("noEvents")}
            actionLabel={canCreateEvents ? t("createEvent") : undefined}
            onAction={canCreateEvents ? () => navigate("/create/event") : undefined}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default AllEvents;