import { t } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Camera, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { QrScanner } from "./QrScanner";
import { useRedeemSigningToken, useRequestLogSignature } from "@/hooks/useSigning";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  diveLogId: string;
  /** Instructor name recorded on the log/register — used to prefill the search. */
  defaultInstructorName?: string | null;
}

type Stage = "intro" | "scanning" | "ask" | "success" | "requested";

interface InstructorHit {
  user_id: string;
  name: string;
  last_name: string | null;
  instructor_brevetto_label: string | null;
}

export const RequestSignatureModal = ({ open, onClose, diveLogId, defaultInstructorName }: Props) => {
  const [stage, setStage] = useState<Stage>("intro");
  const [verifierName, setVerifierName] = useState<string>("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstructorHit[]>([]);
  const [searching, setSearching] = useState(false);
  const redeem = useRedeemSigningToken();
  const requestSignature = useRequestLogSignature();

  const handleClose = () => {
    setStage("intro");
    setQuery("");
    setResults([]);
    onClose();
  };


  const handleDecoded = async (token: string) => {
    try {
      const res = await redeem.mutateAsync({ diveLogId, token: token.trim() });
      const name = [res.verifier.name, res.verifier.last_name].filter(Boolean).join(" ") || t("rqDefaultInstructor");
      setVerifierName(name);
      setStage("success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("rqErrSign"));
      setStage("intro");
    }
  };

  const runSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase.rpc("search_instructors", { _q: q.trim() });
    setResults((data ?? []) as InstructorHit[]);
    setSearching(false);
  };

  // Prefill with the instructor recorded on the outing, if any.
  useEffect(() => {
    if (!open || stage !== "ask") return;
    const name = (defaultInstructorName ?? "").split("·")[0].trim();
    if (!name || query) return;
    void runSearch(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stage, defaultInstructorName]);



  const handleAsk = async (hit: InstructorHit) => {
    try {
      await requestSignature.mutateAsync({ diveLogId, instructorUserId: hit.user_id });
      setVerifierName([hit.name, hit.last_name].filter(Boolean).join(" "));
      setStage("requested");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("rqErrSign"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        {stage === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("rqTitle")}</DialogTitle>
              <DialogDescription>
                {t("rqIntro")}
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full h-11 gap-2 mt-2" onClick={() => setStage("scanning")}>
              <Camera className="w-4 h-4" /> {t("rqOpenCamera")}
            </Button>
            <Button variant="outline" className="w-full h-11 gap-2" onClick={() => setStage("ask")}>
              <Send className="w-4 h-4" /> {t("rqAskInstructor")}
            </Button>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t("rqSingleUseNote")}
            </p>
          </>
        )}

        {stage === "ask" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("rqAskTitle")}</DialogTitle>
              <DialogDescription>{t("rqAskDesc")}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={query}
                onChange={(e) => runSearch(e.target.value)}
                placeholder={t("rqAskPlaceholder")}
                className="h-9"
              />
            </div>
            {searching && <p className="text-xs text-muted-foreground">{t("rdSearching")}</p>}
            {results.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border bg-background">
                {results.map((r) => (
                  <li key={r.user_id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{[r.name, r.last_name].filter(Boolean).join(" ")}</p>
                      {r.instructor_brevetto_label && (
                        <p className="text-[11px] text-muted-foreground truncate">{r.instructor_brevetto_label}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAsk(r)}
                      disabled={requestSignature.isPending}
                    >
                      {t("rqAskSend")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("rqAskNoResults")}</p>
            )}
            <Button variant="outline" onClick={() => setStage("intro")}>
              {t("cancel")}
            </Button>
          </>
        )}

        {stage === "scanning" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("rqScanTitle")}</DialogTitle>
              <DialogDescription>
                {t("rqScanDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl overflow-hidden border border-border">
              <QrScanner
                onDecoded={handleDecoded}
                onError={() => toast.error(t("rqScanErrCamera"))}
                paused={redeem.isPending}
              />
            </div>
            {redeem.isPending && (
              <p className="text-xs text-muted-foreground text-center">{t("rqVerifying")}</p>
            )}
            <Button variant="outline" onClick={() => setStage("intro")}>
              {t("cancel")}
            </Button>
          </>
        )}

        {stage === "requested" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-foreground))]" />
                {t("rqRequestedTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("rqRequestedDesc", { name: verifierName })}
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full h-11" onClick={handleClose}>
              Ok
            </Button>
          </>
        )}

        {stage === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-foreground))]" />
                {t("rqSignedTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("rqSignedDesc", { name: verifierName })}
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full h-11" onClick={handleClose}>
              Ok
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
