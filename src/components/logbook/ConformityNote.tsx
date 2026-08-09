import { t } from "@/lib/i18n";
import { Info } from "lucide-react";

export const ConformityNote = ({ compact = false }: { compact?: boolean }) => {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("conformityCompact")}
      </p>
    );
  }
  return (
    <section className="rounded-2xl bg-secondary/60 border border-border p-4 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" /> {t("conformityHeader")}
      </h3>
      <dl className="text-sm space-y-1">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {t("conformityAuto")} <span className="text-xs">(g)</span>
          </dt>
          <dd className="font-medium text-right">{t("conformityAutoValue")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {t("conformityMix")} <span className="text-xs">(h)</span>
          </dt>
          <dd className="font-medium text-right">{t("conformityMixValue")}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground pt-1">
        {t("conformityFooter")}
      </p>
    </section>
  );
};
