import { t } from "@/lib/i18n";
import type { RegisterStatus } from "@/hooks/useDiveRegisters";

const getLabels = (): Record<RegisterStatus, string> => ({
  da_aprire: t("stDaAprire"),
  aperto: t("stAperto"),
  chiuso: t("stChiuso"),
});

const STYLES: Record<RegisterStatus, string> = {
  da_aprire: "bg-primary/15 text-primary border border-primary/30",
  aperto: "bg-amber-500/15 text-amber-700 border border-amber-500/40 dark:text-amber-300",
  chiuso: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 dark:text-emerald-300",
};

export const StatusBadge = ({ status }: { status: RegisterStatus }) => {
  const labels = getLabels();
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STYLES[status]}`}>
      {labels[status]}
    </span>
  );
};
