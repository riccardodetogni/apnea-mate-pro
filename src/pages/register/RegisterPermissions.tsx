import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Check, X, Award, Users, FileText } from "lucide-react";
import { t } from "@/lib/i18n";

const Row = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <li className="flex items-center gap-2 py-1.5 text-sm">
    {ok ? (
      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground shrink-0" />
    )}
    <span className={ok ? "text-card-foreground" : "text-card-foreground/60"}>{children}</span>
  </li>
);

const RegisterPermissions = () => {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("rpTitle")}</h1>
      </header>

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        {t("rpIntro1")}<strong>{t("rpIntroStrong")}</strong>{t("rpIntro2")}
      </p>

      <div className="card-session !rounded-2xl !p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-card-foreground">{t("rpSchool")}</h2>
        </div>
        <ul>
          <Row ok>{t("rpSchool1")}</Row>
          <Row ok>{t("rpSchool2")}</Row>
          <Row ok>{t("rpSchool3")}</Row>
          <Row ok>{t("rpSchool4")}</Row>
          <Row ok>{t("rpSchool5")}</Row>
          <Row ok={false}>{t("rpSchool6")}</Row>
        </ul>
      </div>

      <div className="card-session !rounded-2xl !p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-card-foreground">{t("rpInstructor")}</h2>
        </div>
        <ul>
          <Row ok>{t("rpInstructor1")}</Row>
          <Row ok>{t("rpInstructor2a")}<strong>{t("rpInstructor2b")}</strong></Row>
          <Row ok>{t("rpInstructor3")}</Row>
        </ul>
      </div>

      <div className="card-session !rounded-2xl !p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold text-card-foreground">{t("rpMember")}</h2>
        </div>
        <ul>
          <Row ok>{t("rpMember1")}</Row>
          <Row ok={false}>{t("rpMember2")}</Row>
        </ul>
      </div>
    </AppLayout>
  );
};

export default RegisterPermissions;
