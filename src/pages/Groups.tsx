import { AppLayout } from "@/components/layout/AppLayout";
import { GroupCard } from "@/components/community/GroupCard";
import { SectionHeader } from "@/components/community/SectionHeader";
import { t } from "@/lib/i18n";
import { Users } from "lucide-react";

const groups = [
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
  {
    id: "3",
    name: "Y-40 Deep Divers",
    initial: "Y",
    memberCount: 56,
    activityType: "Deep pool",
    tags: ["Allenamento profondità", "Avanzati"],
    distanceKm: 45,
  },
  {
    id: "4",
    name: "Liguria Freediving",
    initial: "L",
    memberCount: 28,
    activityType: "Mare",
    tags: ["Uscite mare", "Tutti i livelli"],
    distanceKm: 65,
  },
];

const Groups = () => {
  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("navGroups")}</h1>
        <p className="text-sm text-muted mt-1">{t("groupsNearYou")}</p>
      </header>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="animate-fade-in">
            <GroupCard {...group} />
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Groups;
