import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { SearchBar } from "@/components/community/SearchBar";
import { SectionHeader } from "@/components/community/SectionHeader";
import { SessionCard } from "@/components/community/SessionCard";
import { GroupCard } from "@/components/community/GroupCard";
import { EmptyCard } from "@/components/community/EmptyCard";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";

// Placeholder data matching the HTML reference
const nearYouSessions = [
  {
    id: "1",
    spotName: "Noli",
    environmentType: "Mare",
    sessionType: "Uscita mare",
    dateTime: "Domani · 08:30 · 2h",
    title: "Allenamento profondità",
    level: "intermediate" as const,
    spotsAvailable: 4,
    spotsTotal: 6,
    creatorName: "Riccardo",
    creatorInitial: "R",
    creatorRole: "instructor" as const,
  },
  {
    id: "2",
    spotName: "Y-40",
    environmentType: "Deep pool",
    sessionType: "Piscina profonda",
    dateTime: "Ven · 19:00 · 1h 30",
    title: "Tecnica compensazione",
    level: "beginner" as const,
    spotsAvailable: 2,
    spotsTotal: 5,
    creatorName: "Cristina",
    creatorInitial: "C",
    creatorRole: "instructorF" as const,
  },
];

const followingSessions = [
  {
    id: "3",
    spotName: "Portofino",
    environmentType: "Mare",
    sessionType: "Uscita mare",
    dateTime: "Sab · 10:00 · 3h",
    title: "Easy apnea & snorkeling",
    level: "allLevels" as const,
    spotsAvailable: 8,
    spotsTotal: 10,
    creatorName: "Eleonora",
    creatorInitial: "E",
    creatorRole: "user" as const,
  },
];

const nearYouGroups = [
  {
    id: "1",
    name: "Apnea Milano ASD",
    initial: "A",
    memberCount: 34,
    activityType: "Piscina & mare",
    tags: ["Allenamenti settimanali", "Corsi base"],
    distanceKm: 4,
  },
  {
    id: "2",
    name: "Lago Lovers",
    initial: "L",
    memberCount: 12,
    activityType: "Lago",
    tags: ["Uscite weekend", "Livello misto"],
    distanceKm: 18,
  },
];

const Community = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      {/* Header */}
      <CommunityHeader />

      {/* Search */}
      <SearchBar />

      {/* Sessions near you */}
      <SectionHeader 
        title={t("sessionsNearYou")} 
        actionLabel={t("viewAll")}
        onAction={() => {}}
      />
      <div className="scroll-row">
        {nearYouSessions.map((session) => (
          <SessionCard
            key={session.id}
            {...session}
            showJoinButton={session.id === "1"}
          />
        ))}
      </div>

      {/* From people you follow */}
      <div className="mt-4">
        <SectionHeader 
          title={t("fromPeopleYouFollow")} 
          actionLabel={t("viewAll")}
          onAction={() => {}}
        />
        <div className="scroll-row">
          {followingSessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              showJoinButton={true}
              onJoin={() => {}}
            />
          ))}
          <EmptyCard
            message={t("noMoreSessions")}
            actionLabel={t("exploreFreedivers")}
            onAction={() => {}}
          />
        </div>
      </div>

      {/* Groups near you */}
      <div className="mt-4">
        <SectionHeader 
          title={t("groupsNearYou")} 
          actionLabel={t("viewAllGroups")}
          onAction={() => {}}
        />
        <div className="scroll-row">
          {nearYouGroups.map((group) => (
            <GroupCard
              key={group.id}
              {...group}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Community;
