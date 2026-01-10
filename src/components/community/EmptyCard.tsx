import { t } from "@/lib/i18n";

interface EmptyCardProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyCard = ({
  message,
  actionLabel,
  onAction,
}: EmptyCardProps) => {
  return (
    <div className="card-empty min-w-[260px]">
      <p>{message || t("noMoreSessions")}</p>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="text-[13px] text-primary cursor-pointer hover:underline w-fit"
        >
          {actionLabel || t("exploreFreedivers")}
        </button>
      )}
    </div>
  );
};
