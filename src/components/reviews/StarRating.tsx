import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  readonly?: boolean;
}

export const StarRating = ({ value, onChange, size = "md", readonly = false }: StarRatingProps) => {
  const starSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                starSize,
                filled
                  ? "fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]"
                  : "fill-none text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
