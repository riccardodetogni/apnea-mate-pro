import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getPrivacyPolicy,
  getPrivacyLastUpdated,
  type PrivacySection,
} from "@/lib/privacyPolicy";

const SectionBlock = ({ section }: { section: PrivacySection }) => {
  const isSubsection = section.number.includes(".");
  const HeadingTag = isSubsection ? "h3" : "h2";
  return (
    <section className={isSubsection ? "ml-0 sm:ml-4" : ""}>
      <HeadingTag
        className={
          isSubsection
            ? "text-base font-semibold text-foreground mt-6 mb-2"
            : "text-lg sm:text-xl font-bold text-foreground mt-8 mb-3"
        }
      >
        {section.number}. {section.title}
      </HeadingTag>
      {section.paragraphs?.map((p, i) => (
        <p
          key={`p-${i}`}
          className="text-sm text-foreground leading-relaxed mb-2"
        >
          {p}
        </p>
      ))}
      {section.list && section.list.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 my-2 text-sm text-foreground leading-relaxed">
          {section.list.map((item, i) => (
            <li key={`li-${i}`}>{item}</li>
          ))}
        </ul>
      )}
      {section.meta && section.meta.length > 0 && (
        <dl className="mt-2 space-y-1.5 text-sm text-foreground leading-relaxed">
          {section.meta.map((m, i) => (
            <div key={`m-${i}`}>
              <dt className="inline font-semibold">{m.label}: </dt>
              <dd className="inline">{m.body}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const policy = getPrivacyPolicy(language);
  const lastUpdated = getPrivacyLastUpdated(language);

  useEffect(() => {
    const prevTitle = document.title;
    const prevDescEl = document.querySelector('meta[name="description"]');
    const prevDesc = prevDescEl?.getAttribute("content") ?? null;

    document.title = `${policy.pageTitle} — Apnea Mate`;
    const desc =
      language === "en"
        ? "Apnea Mate Privacy Policy — how we process personal data under GDPR."
        : "Informativa Privacy di Apnea Mate — come trattiamo i dati personali ai sensi del GDPR.";
    if (prevDescEl) {
      prevDescEl.setAttribute("content", desc);
    }
    return () => {
      document.title = prevTitle;
      if (prevDescEl && prevDesc !== null) {
        prevDescEl.setAttribute("content", prevDesc);
      }
    };
  }, [language, policy.pageTitle]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/community");
            }
          }}
          className="mb-4 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("back")}
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {policy.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">{policy.intro}</p>

        {policy.langDisclaimer && (
          <div className="p-3 rounded-xl bg-muted/40 border border-border mb-6">
            <p className="text-xs text-muted-foreground">
              {policy.langDisclaimer}
            </p>
          </div>
        )}

        <div className="space-y-1">
          {policy.sections.map((s) => (
            <SectionBlock key={s.number} section={s} />
          ))}
        </div>

        <p className="mt-10 pt-4 border-t border-border text-xs text-muted-foreground">
          {policy.lastUpdatedLabel}: {lastUpdated}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;