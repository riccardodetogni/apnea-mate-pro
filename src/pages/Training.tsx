import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { t } from "@/lib/i18n";
import { Lock, Wind, TableProperties } from "lucide-react";
import { TrainingMode, Co2TableConfig as Co2Config, QuadraticConfig as QConfig, TrainingStep, generateCo2Steps, generateQuadraticSteps } from "@/types/training";
import { Co2TableConfig } from "@/components/training/Co2TableConfig";
import { QuadraticConfig } from "@/components/training/QuadraticConfig";
import { TrainingTimer } from "@/components/training/TrainingTimer";

type Screen = "home" | "co2-config" | "quadratic-config" | "timer";

const Training = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [trainingSteps, setTrainingSteps] = useState<TrainingStep[]>([]);
  const [trainingMode, setTrainingMode] = useState<TrainingMode>("co2");

  const handleStartCo2 = (config: Co2Config) => {
    setTrainingSteps(generateCo2Steps(config));
    setTrainingMode("co2");
    setScreen("timer");
  };

  const handleStartQuadratic = (config: QConfig) => {
    setTrainingSteps(generateQuadraticSteps(config));
    setTrainingMode("quadratic");
    setScreen("timer");
  };

  const handleFinish = () => {
    setScreen("home");
    setTrainingSteps([]);
  };

  return (
    <AppLayout>
      {screen === "home" && (
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{t("myTraining")}</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted mt-1">
              <Lock className="w-3.5 h-3.5" />
              <span>{t("privateLog")}</span>
            </div>
          </header>

          <p className="text-sm text-muted-foreground mb-4">{t("selectMode")}</p>

          <div className="flex flex-col gap-3">
            {/* CO2 Table card */}
            <button
              onClick={() => setScreen("co2-config")}
              className="card-session !rounded-2xl !p-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--badge-blue-bg))] flex items-center justify-center shrink-0">
                  <TableProperties className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground text-base">{t("co2Table")}</h3>
                  <p className="text-sm text-[hsl(var(--card-muted))] mt-0.5">{t("co2TableDesc")}</p>
                </div>
              </div>
            </button>

            {/* Quadratic Breathing card */}
            <button
              onClick={() => setScreen("quadratic-config")}
              className="card-session !rounded-2xl !p-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--badge-blue-bg))] flex items-center justify-center shrink-0">
                  <Wind className="w-6 h-6 text-[hsl(142,71%,45%)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground text-base">{t("quadraticBreathing")}</h3>
                  <p className="text-sm text-[hsl(var(--card-muted))] mt-0.5">{t("quadraticBreathingDesc")}</p>
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {screen === "co2-config" && (
        <Co2TableConfig onStart={handleStartCo2} onBack={() => setScreen("home")} />
      )}

      {screen === "quadratic-config" && (
        <QuadraticConfig onStart={handleStartQuadratic} onBack={() => setScreen("home")} />
      )}

      {screen === "timer" && trainingSteps.length > 0 && (
        <TrainingTimer steps={trainingSteps} mode={trainingMode} onFinish={handleFinish} />
      )}
    </AppLayout>
  );
};

export default Training;
