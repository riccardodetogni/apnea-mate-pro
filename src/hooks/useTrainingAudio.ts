import { useRef, useCallback, useState } from "react";
import { getLanguage } from "@/lib/i18n";

export const useTrainingAudio = () => {
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const beep = useCallback((frequency = 880, duration = 150) => {
    if (muted) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }, [muted, getAudioCtx]);

  const speak = useCallback((text: string) => {
    if (muted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguage() === "it" ? "it-IT" : "en-US";
      utterance.rate = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [muted]);

  const speakPhase = useCallback((phase: string) => {
    const lang = getLanguage();
    const map: Record<string, Record<string, string>> = {
      it: { breathe: "Respira", hold: "Apnea", inhale: "Inspira", exhale: "Espira" },
      en: { breathe: "Breathe", hold: "Hold", inhale: "Inhale", exhale: "Exhale" },
    };
    speak(map[lang]?.[phase] || phase);
  }, [speak]);

  const speakCountdown = useCallback((seconds: number) => {
    const lang = getLanguage();
    if (seconds === 10) {
      speak(lang === "it" ? "10 secondi" : "10 seconds");
    } else if (seconds <= 3 && seconds >= 1) {
      speak(String(seconds));
    }
  }, [speak]);

  const cleanup = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  return { muted, toggleMute, beep, speak, speakPhase, speakCountdown, cleanup };
};
