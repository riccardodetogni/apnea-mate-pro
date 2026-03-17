import { StarRating } from "./StarRating";
import { t } from "@/lib/i18n";

interface ReviewSummaryProps {
  average: number;
  count: number;
}

export const ReviewSummary = ({ average, count }: ReviewSummaryProps) => {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <StarRating value={average} readonly size="sm" />
      <span className="text-sm font-medium text-card-foreground">
        {average.toFixed(1)}
      </span>
      <span className="text-xs text-[hsl(var(--card-muted))]">
        ({count})
      </span>
    </div>
  );
};
