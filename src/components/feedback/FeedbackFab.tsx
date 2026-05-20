import { useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackSheet } from "./FeedbackSheet";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export const FeedbackFab = ({ className }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("feedbackFabLabel")}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed left-3 z-30 h-11 w-11 rounded-full",
          "bg-card/80 backdrop-blur border border-border/60 shadow-lg",
          "text-card-foreground flex items-center justify-center",
          "hover:bg-card transition-colors active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
          className,
        )}
      >
        <MessageSquareWarning className="h-5 w-5" />
      </button>
      <FeedbackSheet open={open} onOpenChange={setOpen} />
    </>
  );
};