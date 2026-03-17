import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { Loader2, Trash2 } from "lucide-react";

interface ReviewFormProps {
  initialRating?: number;
  initialComment?: string;
  isEditing?: boolean;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export const ReviewForm = ({
  initialRating = 0,
  initialComment = "",
  isEditing = false,
  onSubmit,
  onDelete,
  onCancel,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(rating, comment || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>

      <Textarea
        placeholder={t("reviewCommentPlaceholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="bg-secondary border-border text-foreground"
        rows={3}
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="flex-1"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEditing ? (
            t("editReview")
          ) : (
            t("leaveReview")
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>

      {isEditing && onDelete && (
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          onClick={async () => {
            setSubmitting(true);
            try { await onDelete(); } finally { setSubmitting(false); }
          }}
          disabled={submitting}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {t("deleteReview")}
        </Button>
      )}
    </div>
  );
};
