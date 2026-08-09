import { t, mapEnvironmentType } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DiveLog } from "@/hooks/useDiveLogs";
import { VerificationBadge } from "./VerificationBadge";

const MONTH_KEYS = [
  "monJan", "monFeb", "monMar", "monApr", "monMay", "monJun",
  "monJul", "monAug", "monSep", "monOct", "monNov", "monDec"
];
const DAY_KEYS = [
  "daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"
];

const formatDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${t(DAY_KEYS[d.getDay()] as any)} ${d.getDate()} ${t(MONTH_KEYS[d.getMonth()] as any)} ${d.getFullYear()}`;
};

export const DiveLogRow = ({ log }: { log: DiveLog }) => {
  const navigate = useNavigate();
  const depth = log.reached_depth_m ?? log.planned_depth_m;
  const spotName = log.spot?.name ?? log.spot_label ?? "—";
  const env = log.spot?.environment_type ? mapEnvironmentType(log.spot.environment_type) : null;
  return (
    <button
      onClick={() => navigate(`/logbook/${log.id}`)}
      className="w-full flex items-center gap-3 rounded-2xl bg-popover border border-border p-3 text-left hover:bg-secondary/60 transition-colors"
    >
      <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center shrink-0">
        <span className="text-xl font-bold text-foreground leading-none">
          {depth != null ? Number(depth) : "—"}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t("lbMeters")}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{log.discipline}</p>
        <p className="text-xs text-muted-foreground truncate">
          {spotName}
          {env ? ` · ${env}` : ""} · {formatDate(log.dive_date)}
        </p>
        <div className="mt-1.5">
          <VerificationBadge log={log} />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
};
