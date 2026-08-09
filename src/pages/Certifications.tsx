import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { CertDisclaimer } from "@/components/register/CertDisclaimer";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

const INSTRUCTOR_CHECKLIST = [
  "cfChkApnea",
  "cfChkInstructor",
  "cfChkMedical",
  "cfChkRc",
  "cfChkFederation",
];

const STAFF_CHECKLIST = [
  "cfChkApnea",
  "cfChkMedical",
  "cfChkInsurance",
];

const ART13_ITEMS = [
  "cfArt13Registry",
  "cfArt13Vat",
  "cfArt13Site",
  "cfArt13FirstAid",
  "cfArt13Insurance",
];

const Certifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { certification, refreshProfile } = useProfile();
  const { isInstructor, isSchoolOrAsd } = useStaffAccess();
  const [brevetto, setBrevetto] = useState("");
  const [art13, setArt13] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (certification?.certification_id) setBrevetto(certification.certification_id);
    else if (certification) setBrevetto(`${certification.agency} · ${certification.level}`);
  }, [certification]);

  const saveBrevetto = async () => {
    if (!user || !brevetto.trim()) return;
    setSaving(true);
    if (certification) {
      const { error } = await supabase
        .from("certifications")
        .update({ certification_id: brevetto.trim() })
        .eq("id", certification.id);
      if (error) toast.error(t("lbSaveFailed"));
      else toast.success(t("cfBrevettoSaved"));
    } else {
      const { error } = await supabase.from("certifications").insert({
        user_id: user.id,
        agency: "AIDA",
        level: "self-declared",
        certification_id: brevetto.trim(),
        status: "approved" as const,
      });
      if (error) toast.error(t("lbSaveFailed"));
      else toast.success(t("cfBrevettoSaved"));
    }
    await refreshProfile();
    setSaving(false);
  };


  const checklist = isInstructor ? INSTRUCTOR_CHECKLIST : isSchoolOrAsd ? STAFF_CHECKLIST : STAFF_CHECKLIST;

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate("/tools")}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{t("cfTitle")}</h1>
        </div>
      </header>

      <p className="text-sm text-foreground/85 leading-relaxed mb-5">
        {t("cfIntro")}
      </p>

      <section className="mb-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("cfSectionBrevetto")}
        </h2>
        <div className="card-session !rounded-2xl !p-4 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-card-foreground mb-2">
              {t("cfApneaLabel")}
            </label>
            <input
              type="text"
              value={brevetto}
              onChange={(e) => setBrevetto(e.target.value)}
              onBlur={saveBrevetto}
              disabled={saving}
              placeholder={t("cfApneaPlaceholder")}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-card-foreground placeholder:text-[hsl(var(--card-muted))] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p className="text-xs text-[hsl(var(--card-muted))] leading-snug">
            {t("cfManualNote")}
          </p>
        </div>
      </section>


      <section className="mb-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("cfSectionRequired")}
        </h2>
        <div className="card-session !rounded-2xl !p-3">
          <ul className="divide-y divide-white/10">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-3 py-3 px-1">
                <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </span>
                <span className="text-sm text-card-foreground">{t(item as any)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {isSchoolOrAsd && (
        <section className="mb-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("cfSectionArt13")}
          </h2>
          <div className="card-session !rounded-2xl !p-3">
            <ul className="divide-y divide-white/10">
              {ART13_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-3 py-2.5 px-1">
                  <Checkbox
                    checked={!!art13[item]}
                    onCheckedChange={(v) => setArt13((prev) => ({ ...prev, [item]: !!v }))}
                  />
                  <span className="text-sm text-card-foreground">{t(item as any)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {t("cfArt13Footer")}
          </p>
        </section>
      )}

      <CertDisclaimer />
    </AppLayout>
  );
};

export default Certifications;
