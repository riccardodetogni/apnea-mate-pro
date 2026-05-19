import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, MessageSquare } from "lucide-react";
import { useAllFeedback, useUpdateFeedback, useDeleteFeedback, FeedbackStatus, FeedbackCategory } from "@/hooks/useFeedback";
import { t } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";

const statusLabel = (s: FeedbackStatus) =>
  s === "new" ? t("feedbackStatusNew") : s === "in_review" ? t("feedbackStatusInReview") : t("feedbackStatusResolved");

const categoryLabel = (c: FeedbackCategory) =>
  c === "bug" ? t("feedbackBug") : c === "suggestion" ? t("feedbackSuggestion") : t("feedbackOther");

export const FeedbackList = () => {
  const { data: items = [], isLoading } = useAllFeedback(true);
  const update = useUpdateFeedback();
  const del = useDeleteFeedback();
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t("noFeedbackYet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((f) => {
        const initial = (f.profile?.name || "?").charAt(0).toUpperCase();
        const draft = notesDraft[f.id] ?? f.admin_notes ?? "";
        return (
          <div key={f.id} className="bg-card rounded-xl border border-white/8 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Link to={`/users/${f.user_id}`} className="shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={f.profile?.avatar_url || undefined} />
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/users/${f.user_id}`} className="font-medium text-card-foreground truncate hover:underline">
                    {f.profile?.name || "Unknown"}
                  </Link>
                  <Badge variant="outline" className="text-[10px]">{categoryLabel(f.category)}</Badge>
                </div>
                <p className="text-xs text-white/55 truncate">{f.profile?.email}</p>
                <p className="text-[11px] text-white/45 mt-0.5">
                  {new Date(f.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant={f.status === "resolved" ? "default" : f.status === "new" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                {statusLabel(f.status)}
              </Badge>
            </div>

            <p className="text-sm text-card-foreground whitespace-pre-wrap break-words">
              {f.message}
            </p>

            <div className="flex items-center gap-2">
              <Select
                value={f.status}
                onValueChange={async (v) => {
                  try {
                    await update.mutateAsync({ id: f.id, status: v as FeedbackStatus });
                  } catch (e: any) {
                    toast({ title: t("error"), description: e?.message, variant: "destructive" });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("feedbackStatusNew")}</SelectItem>
                  <SelectItem value="in_review">{t("feedbackStatusInReview")}</SelectItem>
                  <SelectItem value="resolved">{t("feedbackStatusResolved")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={async () => {
                  if (!confirm("Delete this feedback?")) return;
                  try { await del.mutateAsync(f.id); } catch (e: any) {
                    toast({ title: t("error"), description: e?.message, variant: "destructive" });
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Textarea
                value={draft}
                onChange={(e) => setNotesDraft((s) => ({ ...s, [f.id]: e.target.value }))}
                placeholder={t("adminNotesPlaceholder")}
                rows={2}
                className="text-xs"
              />
              {draft !== (f.admin_notes ?? "") && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async () => {
                    try {
                      await update.mutateAsync({ id: f.id, admin_notes: draft });
                      toast({ title: t("saveNotes") });
                    } catch (e: any) {
                      toast({ title: t("error"), description: e?.message, variant: "destructive" });
                    }
                  }}
                >
                  {t("saveNotes")}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};