import { StarRating } from "./StarRating";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { it as itLocale, enUS } from "date-fns/locale";

interface ReviewCardProps {
  rating: number;
  comment: string | null;
  createdAt: string;
}

export const ReviewCard = ({ rating, comment, createdAt }: ReviewCardProps) => {
  const { language } = useLanguage();

  return (
    <div className="card-session !rounded-xl !p-0">
      <div className="relative z-[1] p-4">
        <div className="flex items-center justify-between mb-1">
          <StarRating value={rating} readonly size="sm" />
          <span className="text-xs text-[hsl(var(--card-muted))]">
            {formatDistanceToNow(new Date(createdAt), {
              addSuffix: true,
              locale: language === "it" ? itLocale : enUS,
            })}
          </span>
        </div>
        {comment && (
          <p className="text-sm text-[hsl(var(--card-soft))] mt-2 leading-relaxed">
            {comment}
          </p>
        )}
      </div>
    </div>
  );
};
