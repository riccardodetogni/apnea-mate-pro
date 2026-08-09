import { t } from "@/lib/i18n";
import { useState } from "react";

export const CertDisclaimer = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-secondary/60 p-4 text-xs text-muted-foreground leading-relaxed">
      <p>{open ? t("cfDisclaimerFull") : t("cfDisclaimerShort")}</p>
      <button onClick={() => setOpen((v) => !v)} className="mt-1.5 text-primary font-medium text-xs">
        {open ? t("lbCollapse") : t("lbReadMore")}
      </button>
    </div>
  );
};
