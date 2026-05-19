import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { useMyFeedback, useSubmitFeedback, FeedbackCategory, FeedbackStatus } from "@/hooks/useFeedback";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const statusLabel = (s: FeedbackStatus) =>
  s === "new" ? t("feedbackStatusNew") : s === "in_review" ? t("feedbackStatusInReview") : t("feedbackStatusResolved");

const categoryLabel = (c: FeedbackCategory) =>
  c === "bug" ? t("feedbackBug") : c === "suggestion" ? t("feedbackSuggestion") : t("feedbackOther");

export const FeedbackSheet = ({ open, onOpenChange }: Props) => {
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const submit = useSubmitFeedback();
  const { data: mine = [] } = useMyFeedback();

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 1) {
      toast({ title: t("feedbackEmpty"), variant: "destructive" });
      return;
    }
    if (trimmed.length > 2000) {
      toast({ title: t("feedbackError"), description: "Max 2000", variant: "destructive" });
      return;
    }
    try {
      await submit.mutateAsync({ category, message: trimmed });
      toast({ title: t("feedbackSent") });
      setMessage("");
      setCategory("suggestion");
    } catch (e: any) {
      toast({ title: t("feedbackError"), description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{t("feedbackTitle")}</SheetTitle>
          <SheetDescription>{t("feedbackSubtitle")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>{t("feedbackCategory")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{t("feedbackBug")}</SelectItem>
                <SelectItem value="suggestion">{t("feedbackSuggestion")}</SelectItem>
                <SelectItem value="other">{t("feedbackOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("feedbackMessagePlaceholder")}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder={t("feedbackMessagePlaceholder")}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
          </div>

          <Button onClick={handleSubmit} disabled={submit.isPending} className="w-full">
            {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("feedbackSubmit")}
          </Button>
        </div>

        {mine.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">{t("myFeedback")}</h3>
            <div className="space-y-2">
              {mine.map((f) => (
                <div key={f.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{categoryLabel(f.category)}</Badge>
                    <Badge variant={f.status === "resolved" ? "default" : "secondary"} className="text-xs">
                      {statusLabel(f.status)}
                    </Badge>
                  </div>
                  <p className="text-foreground/90 whitespace-pre-wrap break-words">{f.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};