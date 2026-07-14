import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, ArrowDown, User, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Logo } from "@/components/brand/Logo";
import { BrandIcon, BrandIconName } from "@/components/brand/BrandIcon";
import { Button } from "@/components/ui/button";
import symbolWhite from "@/assets/logos/apnea_mate_pittogramma_white.png";
import communityAsset from "@/assets/landing/community.png.asset.json";
import groupsAsset from "@/assets/landing/groups.png.asset.json";
import spotsAsset from "@/assets/landing/spots.png.asset.json";

const BackgroundSymbols = ({ variant }: { variant: "hero" | "final" }) => {
  const sizeClass =
    variant === "hero"
      ? "w-[140vw] sm:w-[110vw] max-w-none"
      : "w-[900px] max-w-none";
  const opacity = variant === "hero" ? 0.09 : 0.05;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img
        src={symbolWhite}
        alt=""
        draggable={false}
        className={`select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeClass}`}
        style={{ opacity }}
      />
    </div>
  );
};

const PhoneMockup = ({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  return (
    <div className={`relative w-full flex justify-center ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18), transparent 65%), radial-gradient(circle at 70% 20%, hsl(var(--accent) / 0.18), transparent 55%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="relative w-full max-w-[320px] overflow-hidden rounded-[2rem] md:rotate-[1.5deg] md:hover:rotate-0 transition-transform duration-500"
        style={{
          border: "1px solid hsl(var(--landing-light-border))",
          boxShadow: "0 30px 80px -30px hsl(var(--primary) / 0.45), 0 10px 30px -10px hsl(222 47% 11% / 0.25)",
          background: "hsl(var(--landing-light-card))",
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
          className="pointer-events-none select-none w-full h-[420px] md:h-[560px] object-cover object-top"
        />
      </div>
    </div>
  );
};

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="flex items-center rounded-full overflow-hidden"
      style={{
        background: "hsl(0 0% 100% / 0.08)",
        backdropFilter: "blur(14px)",
        border: "1px solid hsl(0 0% 100% / 0.12)",
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
            language === lng
              ? "bg-white/15 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const FEATURES: Array<{
  icon: BrandIconName;
  titleKey: "landingFeatureSpotTitle" | "landingFeatureGroupsTitle" | "landingFeatureSessionsTitle";
  descKey: "landingFeatureSpotDesc" | "landingFeatureGroupsDesc" | "landingFeatureSessionsDesc";
}> = [
  { icon: "spot", titleKey: "landingFeatureSpotTitle", descKey: "landingFeatureSpotDesc" },
  { icon: "gruppi", titleKey: "landingFeatureGroupsTitle", descKey: "landingFeatureGroupsDesc" },
  { icon: "buddy", titleKey: "landingFeatureSessionsTitle", descKey: "landingFeatureSessionsDesc" },
];

const AUDIENCE: Array<{
  icon: BrandIconName;
  titleKey: "landingAudienceApneistiTitle" | "landingAudienceInstructorsTitle" | "landingAudienceSchoolsTitle";
  descKey: "landingAudienceApneistiDesc" | "landingAudienceInstructorsDesc" | "landingAudienceSchoolsDesc";
}> = [
  { icon: "buddy", titleKey: "landingAudienceApneistiTitle", descKey: "landingAudienceApneistiDesc" },
  { icon: "scuole", titleKey: "landingAudienceInstructorsTitle", descKey: "landingAudienceInstructorsDesc" },
  { icon: "gruppi", titleKey: "landingAudienceSchoolsTitle", descKey: "landingAudienceSchoolsDesc" },
];

const DARK_BG =
  "radial-gradient(ellipse at top, hsl(var(--landing-dark-2)) 0%, hsl(var(--landing-dark)) 60%, hsl(var(--landing-dark)) 100%)";

const Landing = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"apneista" | "instructor">("apneista");
  const [routingAuthed, setRoutingAuthed] = useState(false);

  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [language]);

  useEffect(() => {
    if (!user) return;
    setRoutingAuthed(true);
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, location")
        .eq("user_id", user.id)
        .single();
      navigate(profile?.location ? "/community" : "/onboarding", { replace: true });
    })();
  }, [user, navigate]);

  if (loading || routingAuthed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: DARK_BG }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-white/80" />
      </div>
    );
  }

  const goRegister = () => navigate("/auth?mode=register");
  const goLogin = () => navigate("/auth?mode=login");
  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const steps = tab === "apneista"
    ? ([
        { titleKey: "landingStepApneista1Title", descKey: "landingStepApneista1Desc" },
        { titleKey: "landingStepApneista2Title", descKey: "landingStepApneista2Desc" },
        { titleKey: "landingStepApneista3Title", descKey: "landingStepApneista3Desc" },
      ] as const)
    : ([
        { titleKey: "landingStepInstructor1Title", descKey: "landingStepInstructor1Desc" },
        { titleKey: "landingStepInstructor2Title", descKey: "landingStepInstructor2Desc" },
        { titleKey: "landingStepInstructor3Title", descKey: "landingStepInstructor3Desc" },
      ] as const);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* ============== HERO (dark) ============== */}
      <section
        className="relative overflow-hidden"
        style={{ background: DARK_BG }}
      >
        <BackgroundSymbols variant="hero" />
        {/* decorative blobs */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 15% 30%, hsl(var(--accent) / 0.20), transparent 45%), radial-gradient(circle at 85% 20%, hsl(var(--primary) / 0.22), transparent 50%), radial-gradient(circle at 70% 85%, hsl(var(--primary) / 0.14), transparent 55%)",
          }}
        />

        {/* header */}
        <header
          className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          <Logo variant="horizontal-white" className="h-9 sm:h-10 w-auto" />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={goLogin}
              className="rounded-full px-4 sm:px-5 py-2 text-sm font-semibold text-white transition-colors"
              style={{
                background: "hsl(0 0% 100% / 0.10)",
                border: "1px solid hsl(0 0% 100% / 0.16)",
                backdropFilter: "blur(14px)",
              }}
            >
              {t("landingCtaSecondary")}
            </button>
          </div>
        </header>

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pt-6 sm:pt-10 pb-16 sm:pb-24">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{
              background: "hsl(var(--accent) / 0.14)",
              color: "hsl(var(--accent))",
              border: "1px solid hsl(var(--accent) / 0.35)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--accent))" }} />
            {t("landingBadge")}
          </span>

          <h1 className="mt-5 text-4xl sm:text-6xl font-bold leading-[1.05] text-white">
            {t("landingH1_line1")}
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("landingH1_line2")}
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-white/70 max-w-xl">
            {t("landingSubtitle")}
          </p>

          {/* CTA card */}
          <div
            className="mt-8 sm:mt-10 rounded-3xl p-5 sm:p-6"
            style={{
              background: "hsl(var(--landing-light-card))",
              boxShadow: "0 20px 60px -20px hsl(var(--primary) / 0.35)",
            }}
          >
            <h2 className="text-lg font-bold" style={{ color: "hsl(var(--landing-light-fg))" }}>
              {t("landingCtaCardTitle")}
            </h2>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--landing-light-muted))" }}>
              {t("landingCtaCardSubtitle")}
            </p>
            <Button
              type="button"
              onClick={goRegister}
              variant="primaryGradient"
              className="mt-4 h-12 w-full text-base"
            >
              {t("landingCtaPrimary")} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="mt-3 text-center text-sm" style={{ color: "hsl(var(--landing-light-muted))" }}>
              {t("landingHasAccount")}{" "}
              <button
                type="button"
                onClick={goLogin}
                className="font-semibold underline underline-offset-2"
                style={{ color: "hsl(var(--primary))" }}
              >
                {t("landingCtaSecondary")}
              </button>
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToHow}
            className="mt-8 mx-auto flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            {t("landingScrollHint")} <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ============== LIGHT SECTIONS ============== */}
      <div
        style={{
          background: "hsl(var(--landing-light))",
          color: "hsl(var(--landing-light-fg))",
        }}
      >
        {/* Banner "quante volte…" (dark card inside light bg) */}
        <section className="px-5 sm:px-8 py-14 sm:py-20">
          <div
            className="max-w-3xl mx-auto rounded-3xl p-6 sm:p-10 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--landing-dark)) 0%, hsl(var(--landing-dark-2)) 100%)",
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              {t("landingBannerTitle_pre")}{" "}
              <span style={{ color: "hsl(var(--accent))" }}>{t("landingBannerTitle_where")}</span>
              {" "}{t("landingBannerTitle_and")}{" "}
              <span style={{ color: "hsl(var(--accent))" }}>{t("landingBannerTitle_who")}</span>
              {t("landingBannerTitle_post")}
            </h2>
            <p className="mt-3 text-white/75 max-w-xl">
              {t("landingBannerBody")}
            </p>
            <Button
              type="button"
              onClick={goRegister}
              variant="primaryGradient"
              className="mt-6 h-12 px-6"
            >
              {t("landingBannerCta")} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="px-5 sm:px-8 pb-14 sm:pb-20">
          <div className="max-w-3xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--primary))" }}
            >
              {t("landingFeaturesEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
              {t("landingFeaturesTitle")}
            </h2>

            <div className="mt-8 space-y-4">
              {FEATURES.map((f) => (
                <div
                  key={f.titleKey}
                  className="rounded-2xl p-5 flex items-start gap-4"
                  style={{
                    background: "hsl(var(--landing-light-card))",
                    border: "1px solid hsl(var(--landing-light-border))",
                    boxShadow: "0 4px 20px -8px hsl(222 47% 11% / 0.08)",
                  }}
                >
                  <div
                    className="shrink-0 rounded-xl p-2.5 flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.10)" }}
                  >
                    <BrandIcon name={f.icon} variant="color" size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{t(f.titleKey)}</h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "hsl(var(--landing-light-muted))" }}
                    >
                      {t(f.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className="px-5 sm:px-8 pb-14 sm:pb-20">
          <div className="max-w-3xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--primary))" }}
            >
              {t("landingAudienceEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
              {t("landingAudienceTitle")}
            </h2>

            <div
              className="mt-8 rounded-3xl overflow-hidden"
              style={{
                background: "hsl(var(--landing-light-card))",
                border: "1px solid hsl(var(--landing-light-border))",
                boxShadow: "0 4px 20px -8px hsl(222 47% 11% / 0.08)",
              }}
            >
              {AUDIENCE.map((a, i) => (
                <div
                  key={a.titleKey}
                  className="flex items-start gap-4 p-5"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid hsl(var(--landing-light-border))",
                  }}
                >
                  <div
                    className="shrink-0 rounded-xl p-2.5"
                    style={{ background: "hsl(var(--primary) / 0.10)" }}
                  >
                    <BrandIcon name={a.icon} variant="color" size={36} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{t(a.titleKey)}</h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "hsl(var(--landing-light-muted))" }}
                    >
                      {t(a.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="max-w-3xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--primary))" }}
            >
              {t("landingHowEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
              {t("landingHowTitle")}
            </h2>

            {/* Tabs */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("apneista")}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={
                  tab === "apneista"
                    ? {
                        background: "hsl(var(--primary) / 0.12)",
                        color: "hsl(var(--primary))",
                        border: "1px solid hsl(var(--primary) / 0.35)",
                      }
                    : {
                        background: "hsl(var(--landing-light-card))",
                        color: "hsl(var(--landing-light-muted))",
                        border: "1px solid hsl(var(--landing-light-border))",
                      }
                }
              >
                <User className="w-4 h-4" />
                {t("landingTabApneista")}
              </button>
              <button
                type="button"
                onClick={() => setTab("instructor")}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={
                  tab === "instructor"
                    ? {
                        background: "hsl(var(--success) / 0.14)",
                        color: "hsl(var(--success-foreground))",
                        border: "1px solid hsl(var(--success) / 0.40)",
                      }
                    : {
                        background: "hsl(var(--landing-light-card))",
                        color: "hsl(var(--landing-light-muted))",
                        border: "1px solid hsl(var(--landing-light-border))",
                      }
                }
              >
                <ShieldCheck className="w-4 h-4" />
                {t("landingTabInstructor")}
              </button>
            </div>

            <ol className="mt-8 space-y-6">
              {steps.map((s, i) => (
                <li key={s.titleKey} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{
                        background:
                          tab === "apneista"
                            ? "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)"
                            : "linear-gradient(135deg, hsl(var(--success)) 0%, hsl(142 71% 35%) 100%)",
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="w-px flex-1 mt-2"
                        style={{ background: "hsl(var(--landing-light-border))" }}
                      />
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-bold text-base">{t(s.titleKey)}</h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "hsl(var(--landing-light-muted))" }}
                    >
                      {t(s.descKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* ============== FINAL CTA (dark) ============== */}
      <section
        className="relative overflow-hidden"
        style={{ background: DARK_BG }}
      >
        <BackgroundSymbols variant="final" />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 55%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <Logo variant="symbol-white" className="h-12 w-auto mx-auto" />
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t("landingFinalTitle_line1")}
            <br />
            {t("landingFinalTitle_line2")}
          </h2>
          <p className="mt-4 text-white/70">
            {t("landingFinalSubtitle")}
          </p>
          <Button
            type="button"
            onClick={goRegister}
            variant="primaryGradient"
            className="mt-8 h-12 px-8"
          >
            {t("landingFinalCta")} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <div
            className="mt-14 pt-8 flex flex-col items-center gap-3"
            style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <Logo variant="horizontal-white" className="h-7 w-auto opacity-80" />
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} {t("landingCopyright")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;