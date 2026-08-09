import { t } from "@/lib/i18n";
import { useState } from "react";

export const LogbookRegistroDisclaimer = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-secondary/60 p-3.5 text-xs text-foreground/70 leading-relaxed">
      <p>{open ? t("rgDisclaimerFull") : t("rgDisclaimerShort")}</p>
      <button onClick={() => setOpen((v) => !v)} className="mt-1.5 text-primary font-medium text-xs">
        {open ? t("lbCollapse") : t("lbReadMore")}
      </button>
    </div>
  );
};
