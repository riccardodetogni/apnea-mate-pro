import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { BarChart3, Plus, Lock } from "lucide-react";

const Training = () => {
  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("myTraining")}</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted mt-1">
          <Lock className="w-3.5 h-3.5" />
          <span>{t("privateLog")}</span>
        </div>
      </header>

      {/* Empty state */}
      <div className="p-8 rounded-2xl bg-card border border-white/8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-2">
          Inizia a tracciare i tuoi allenamenti
        </h3>
        <p className="text-sm text-white/55 mb-6">
          Registra le tue sessioni di apnea, tempi statici, profondità e progressi.
        </p>
        <Button variant="primaryGradient" size="pill" className="py-2.5 px-5">
          <Plus className="w-4 h-4" />
          {t("addEntry")}
        </Button>
      </div>

      {/* Stats placeholder */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-card border border-white/8 text-center">
          <p className="text-2xl font-bold text-primary">0</p>
          <p className="text-xs text-white/55">Sessioni totali</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-white/8 text-center">
          <p className="text-2xl font-bold text-primary">0h</p>
          <p className="text-xs text-white/55">Tempo in acqua</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-white/8 text-center">
          <p className="text-2xl font-bold text-primary">0m</p>
          <p className="text-xs text-white/55">Max profondità</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-white/8 text-center">
          <p className="text-2xl font-bold text-primary">0:00</p>
          <p className="text-xs text-white/55">Max statica</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Training;
