import { AppLayout } from "@/components/layout/AppLayout";
import { t } from "@/lib/i18n";
import { Waves, Mountain, Droplets, CircleDot } from "lucide-react";

const spotTypes = [
  { id: "sea", icon: Waves, label: "Mare", count: 24 },
  { id: "lake", icon: Mountain, label: "Lago", count: 8 },
  { id: "pool", icon: Droplets, label: "Piscina", count: 15 },
  { id: "deepPool", icon: CircleDot, label: "Deep pool", count: 6 },
];

const Spots = () => {
  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("discoverSpots")}</h1>
        <p className="text-sm text-muted mt-1">{t("filterByType")}</p>
      </header>

      {/* Spot type filters */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {spotTypes.map(({ id, icon: Icon, label, count }) => (
          <button
            key={id}
            className="p-4 rounded-2xl bg-card border hover:border-primary/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted">{count} spot</p>
          </button>
        ))}
      </div>

      {/* Placeholder for spot list */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center text-muted">
        <Waves className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>La lista degli spot sarà disponibile presto</p>
      </div>
    </AppLayout>
  );
};

export default Spots;
