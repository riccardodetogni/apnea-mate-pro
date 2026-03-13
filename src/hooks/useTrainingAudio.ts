import { useRef, useCallback, useState } from "react";
import { getLanguage } from "@/lib/i18n";

export type MusicTrack = "ocean" | "focus" | "off";

export const useTrainingAudio = () => {
  const [muted, setMuted] = useState(false);
  const [musicTrack, setMusicTrack] = useState<MusicTrack>("off");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

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

  const selectBestVoice = useCallback((lang: string) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return undefined;
    const langPrefix = lang.split("-")[0];
    const matching = voices.filter(v => v.lang.startsWith(langPrefix));
    if (matching.length === 0) return undefined;
    // Prefer premium/remote voices (smoother), then by name quality
    const premiumKeywords = ["siri", "google", "samantha", "alice", "luca", "federica"];
    const scored = matching.map(v => {
      let score = 0;
      if (!v.localService) score += 2; // remote voices tend to be higher quality
      if (premiumKeywords.some(k => v.name.toLowerCase().includes(k))) score += 3;
      return { voice: v, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].voice;
  }, []);

  const speak = useCallback((text: string) => {
    if (muted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = getLanguage() === "it" ? "it-IT" : "en-US";
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      utterance.volume = 1;
      const voice = selectBestVoice(lang);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [muted, selectBestVoice]);

  const speakPhase = useCallback((phase: string) => {
    const lang = getLanguage();
    const map: Record<string, Record<string, string>> = {
      it: { breathe: "Respira", hold: "Apnea", inhale: "Inspira", exhale: "Espira" },
      en: { breathe: "Breathe", hold: "Hold", inhale: "Inhale", exhale: "Exhale" },
    };
    speak(map[lang]?.[phase] || phase);
  }, [speak]);

  const speakPreparation = useCallback(() => {
    const lang = getLanguage();
    speak(lang === "it" ? "Preparati" : "Get ready");
  }, [speak]);

  const speakCountdown = useCallback((seconds: number) => {
    const lang = getLanguage();
    if (seconds === 30) {
      speak(lang === "it" ? "30 secondi" : "30 seconds");
    } else if (seconds === 20) {
      speak(lang === "it" ? "20 secondi" : "20 seconds");
    } else if (seconds === 10) {
      speak(lang === "it" ? "10 secondi" : "10 seconds");
    } else if (seconds === 5) {
      speak(lang === "it" ? "5 secondi" : "5 seconds");
    } else if (seconds <= 3 && seconds >= 1) {
      speak(String(seconds));
    }
  }, [speak]);

  // Background music
  const playMusic = useCallback((track: MusicTrack) => {
    // Stop any existing music
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current = null;
    }
    setMusicTrack(track);
    if (track === "off" || muted) return;

    const file = track === "ocean" ? "/audio/ocean-ambient.mp3" : "/audio/calm-focus.mp3";
    const audio = new Audio(file);
    audio.loop = true;
    audio.volume = 0.15;
    audio.play().catch(() => {});
    musicRef.current = audio;
  }, [muted]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current = null;
    }
    setMusicTrack("off");
  }, []);

  const cleanup = useCallback(() => {
    window.speechSynthesis.cancel();
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const newMuted = !m;
      if (newMuted && musicRef.current) {
        musicRef.current.pause();
      } else if (!newMuted && musicRef.current) {
        musicRef.current.play().catch(() => {});
      }
      return newMuted;
    });
  }, []);

  return { muted, toggleMute, beep, speak, speakPhase, speakPreparation, speakCountdown, cleanup, musicTrack, playMusic, stopMusic };
};
