import { useEffect, useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram } from "lucide-react";
import { BrandIcon, BrandIconName } from "@/components/brand/BrandIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

const LAUNCH_DATE = new Date("2026-05-21T22:00:00Z"); // 22 May 2026 00:00 Europe/Rome (CEST = UTC+2)

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Inserisci un'email valida" })
  .max(255, { message: "Email troppo lunga" });

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

const computeRemaining = (): Remaining => {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
};

const pad = (n: number) => n.toString().padStart(2, "0");

const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center min-w-[68px] sm:min-w-[96px]">
    <div
      className="rounded-2xl px-3 py-3 sm:px-5 sm:py-4 w-full text-center"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span className="block text-3xl sm:text-5xl font-bold tabular-nums text-white">
        {pad(value)}
      </span>
    </div>
    <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/60">
      {label}
    </span>
  </div>
);

const FEATURE_DEFS: Array<{
  icon: BrandIconName;
  titleKey: "comingSoonFeatureSpotTitle" | "comingSoonFeatureBuddyTitle" | "comingSoonFeatureGruppiTitle" | "comingSoonFeatureScuoleTitle";
  descKey: "comingSoonFeatureSpotDesc" | "comingSoonFeatureBuddyDesc" | "comingSoonFeatureGruppiDesc" | "comingSoonFeatureScuoleDesc";
}> = [
  { icon: "spot", titleKey: "comingSoonFeatureSpotTitle", descKey: "comingSoonFeatureSpotDesc" },
  { icon: "buddy", titleKey: "comingSoonFeatureBuddyTitle", descKey: "comingSoonFeatureBuddyDesc" },
  { icon: "gruppi", titleKey: "comingSoonFeatureGruppiTitle", descKey: "comingSoonFeatureGruppiDesc" },
  { icon: "scuole", titleKey: "comingSoonFeatureScuoleTitle", descKey: "comingSoonFeatureScuoleDesc" },
];

const ComingSoon = () => {
  const { user, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [remaining, setRemaining] = useState<Remaining>(computeRemaining);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/community" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setMessage({ type: "error", text: t("comingSoonErrInvalid") });
      return;
    }
    setSubmitting(true);
    const normalizedEmail = parsed.data.toLowerCase();
    const { error } = await supabase.from("waitlist").insert({ email: normalizedEmail });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setMessage({ type: "error", text: t("comingSoonErrAlready") });
      } else {
        setMessage({ type: "error", text: t("comingSoonErrGeneric") });
      }
      return;
    }
    // Fire-and-forget confirmation email — never block UX on it.
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: `waitlist-confirmation-${language}`,
          recipientEmail: normalizedEmail,
          idempotencyKey: `waitlist-${normalizedEmail}`,
        },
      })
      .catch((err) => console.warn("waitlist email send failed", err));
    setEmail("");
    setMessage({ type: "success", text: t("comingSoonSuccess") });
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(210 70% 22%) 0%, hsl(222 47% 11%) 55%, hsl(222 47% 7%) 100%)",
      }}
    >
      {/* Decorative underwater glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 80%, hsl(185 80% 50% / 0.18), transparent 45%), radial-gradient(circle at 80% 20%, hsl(222 90% 55% / 0.16), transparent 45%)",
        }}
      />

      {/* Language toggle */}
      <div
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center rounded-full overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.12)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
        role="group"
        aria-label="Language"
      >
        {(["it", "en"] as const).map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => setLanguage(lng)}
            aria-pressed={language === lng}
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors ${
              language === lng ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>

      <main className="relative w-full max-w-3xl flex flex-col items-center text-center">
        <Logo variant="horizontal-white" className="h-16 sm:h-20 w-auto mb-6" />

        <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white max-w-2xl">
          {t("comingSoonHeadline")}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-white/70 max-w-xl">
          {t("comingSoonSubtitle")}
        </p>

        {/* Countdown */}
        <div className="mt-8 sm:mt-10 flex items-center justify-center gap-2 sm:gap-4">
          <CountdownBlock value={remaining.days} label={t("comingSoonDays")} />
          <CountdownBlock value={remaining.hours} label={t("comingSoonHours")} />
          <CountdownBlock value={remaining.minutes} label={t("comingSoonMinutes")} />
          <CountdownBlock value={remaining.seconds} label={t("comingSoonSeconds")} />
        </div>

        {/* Email capture */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-md flex flex-col gap-2"
        >
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={255}
            placeholder={t("comingSoonEmailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/15 text-white placeholder:text-white/40 h-12"
            aria-label={t("comingSoonEmailPlaceholder")}
          />
          <p className="text-[12px] text-white/60 text-center sm:text-left">
            {t("comingSoonEmailMicrocopy")}
          </p>
          <Button
            type="submit"
            disabled={submitting}
            variant="primaryGradient"
            className="h-12 px-5 shrink-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("comingSoonSubmit")}
          </Button>
        </form>
        {message && (
          <p
            className={`mt-3 text-sm ${
              message.type === "success" ? "text-emerald-300" : "text-red-300"
            }`}
            role="status"
          >
            {message.text}
          </p>
        )}

        {/* Feature teasers */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
          {FEATURE_DEFS.map((f) => (
            <div
              key={f.titleKey}
              className="rounded-2xl p-4 text-left"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="mb-2 flex items-center" aria-hidden>
                <BrandIcon name={f.icon} variant="color" size={40} />
              </div>
              <h3 className="text-sm font-semibold text-white">{t(f.titleKey)}</h3>
              <p className="text-xs text-white/60 mt-1">{t(f.descKey)}</p>
            </div>
          ))}
        </div>

        {/* Social footer */}
        <footer className="mt-12 flex items-center gap-4 text-white/60">
          <a
            href="https://www.instagram.com/apneamate/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-white transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <span className="text-xs">© {new Date().getFullYear()} Apnea Mate s.r.l.s.</span>
        </footer>
      </main>
    </div>
  );
};

export default ComingSoon;