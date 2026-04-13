import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { TrainingStep, TrainingMode, formatTime } from "@/types/training";
import { CircularProgress } from "./CircularProgress";
import { TrainingStepTable } from "./TrainingStepTable";
import { useTrainingTimer } from "@/hooks/useTrainingTimer";
import { useTrainingAudio, MusicTrack } from "@/hooks/useTrainingAudio";
import { Pause, Play, Square, Volume2, VolumeX, CheckCircle, Music } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TrainingTimerProps {
  steps: TrainingStep[];
  mode: TrainingMode;
  onFinish: () => void;
}

const phaseLabels: Record<string, Record<string, string>> = {
  it: { breathe: "Respira", hold: "Apnea", inhale: "Inspira", exhale: "Espira" },
  en: { breathe: "Breathe", hold: "Hold", inhale: "Inhale", exhale: "Exhale" },
};

const phaseTextColors: Record<string, string> = {
  breathe: "text-primary",
  inhale: "text-primary",
  hold: "text-[hsl(38,92%,50%)]",
  exhale: "text-[hsl(142,71%,45%)]",
};

export const TrainingTimer = ({ steps, mode, onFinish }: TrainingTimerProps) => {
  const audio = useTrainingAudio();
  const [musicOpen, setMusicOpen] = useState(false);

  const onPreparationStart = useCallback(() => {
    audio.speakPreparation();
  }, [audio]);

  const onPhaseChange = useCallback((step: TrainingStep) => {
    audio.speakPhase(step.phase);
  }, [audio]);

  const onCountdown = useCallback((seconds: number) => {
    audio.speakCountdown(seconds);
  }, [audio]);

  const onComplete = useCallback(() => {
    audio.beep(1200, 300);
    setTimeout(() => audio.beep(1200, 300), 400);
  }, [audio]);

  const onBeep = useCallback(() => {
    audio.beep(880, 150);
  }, [audio]);

  const timer = useTrainingTimer({
    steps,
    mode,
    onPhaseChange,
    onCountdown,
    onComplete,
    onBeep,
    onPreparationStart,
  });

  // Auto-start on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    timer.start();
    return () => {
      audio.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lang = (typeof window !== "undefined" && localStorage.getItem("apnea-mate-lang")) || "it";

  const handleMusicSelect = (track: MusicTrack) => {
    audio.playMusic(track);
    setMusicOpen(false);
  };

  if (timer.isCompleted) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-[hsl(142,71%,45%)]" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t("trainingComplete")}</h2>
        <Button variant="primaryGradient" size="lg" className="rounded-full" onClick={onFinish}>
          {t("back")}
        </Button>
      </div>
    );
  }

  // Preparation phase screen
  if (timer.isPreparation) {
    return (
      <div className="flex flex-col items-center gap-6">
        {/* Top bar with mute + music */}
        <div className="w-full flex items-center justify-end gap-2">
          <Popover open={musicOpen} onOpenChange={setMusicOpen}>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-full hover:bg-accent/10">
                <Music className={`w-5 h-5 ${audio.musicTrack !== "off" ? "text-primary" : "text-muted-foreground"}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="end">
              <div className="flex flex-col gap-1">
                {(["ocean", "focus", "off"] as MusicTrack[]).map(track => (
                  <button
                    key={track}
                    onClick={() => handleMusicSelect(track)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      audio.musicTrack === track ? "bg-primary/20 text-primary font-medium" : "hover:bg-accent/10 text-foreground"
                    }`}
                  >
                    {t(track === "ocean" ? "musicOcean" : track === "focus" ? "musicFocus" : "musicOff")}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <button onClick={audio.toggleMute} className="p-2 rounded-full hover:bg-accent/10">
            {audio.muted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>

        {/* Preparation label */}
        <div className="text-2xl font-bold uppercase tracking-wider text-primary">
          {t("getReady")}
        </div>

        {/* Circular countdown */}
        <CircularProgress progress={timer.progress} phase="breathe" size={240} strokeWidth={8}>
          <span className="text-5xl font-bold font-mono text-foreground">
            {timer.secondsRemaining}
          </span>
        </CircularProgress>
      </div>
    );
  }

  const currentPhase = timer.currentStep?.phase ?? "breathe";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t("round")} {timer.currentStep?.round ?? 1}/{timer.totalRounds}
        </div>
        <div className="flex items-center gap-1">
          <Popover open={musicOpen} onOpenChange={setMusicOpen}>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-full hover:bg-accent/10">
                <Music className={`w-5 h-5 ${audio.musicTrack !== "off" ? "text-primary" : "text-muted-foreground"}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="end">
              <div className="flex flex-col gap-1">
                {(["ocean", "focus", "off"] as MusicTrack[]).map(track => (
                  <button
                    key={track}
                    onClick={() => handleMusicSelect(track)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      audio.musicTrack === track ? "bg-primary/20 text-primary font-medium" : "hover:bg-accent/10 text-foreground"
                    }`}
                  >
                    {t(track === "ocean" ? "musicOcean" : track === "focus" ? "musicFocus" : "musicOff")}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <button onClick={audio.toggleMute} className="p-2 rounded-full hover:bg-accent/10">
            {audio.muted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Phase label */}
      <div className={`text-2xl font-bold uppercase tracking-wider ${phaseTextColors[currentPhase]}`}>
        {phaseLabels[lang]?.[currentPhase] || currentPhase}
      </div>

      {/* Circular timer */}
      <CircularProgress progress={timer.progress} phase={currentPhase} size={240} strokeWidth={8}>
        <span className="text-5xl font-bold font-mono text-foreground">
          {formatTime(timer.secondsRemaining)}
        </span>
      </CircularProgress>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {timer.isPaused ? (
          <Button variant="primaryGradient" size="lg" className="rounded-full px-8" onClick={timer.resume}>
            <Play className="w-5 h-5" />
            {t("resumeTraining")}
          </Button>
        ) : (
          <Button variant="pillOutline" size="lg" className="rounded-full px-8" onClick={timer.pause}>
            <Pause className="w-5 h-5" />
            {t("pauseTraining")}
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-destructive">
              <Square className="w-5 h-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("stopTraining")}</AlertDialogTitle>
              <AlertDialogDescription>{t("stopTrainingConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => { timer.stop(); onFinish(); }}>
                {t("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Step table for CO2 mode */}
      {(mode === "co2" || mode === "o2") && (
        <div className="w-full mt-2">
          <TrainingStepTable
            steps={steps}
            currentStepIndex={timer.currentStepIndex}
            isRunning={timer.isRunning}
          />
        </div>
      )}
    </div>
  );
};
