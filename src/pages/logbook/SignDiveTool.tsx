import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, QrCode, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PasswordReauthDialog } from "@/components/logbook/PasswordReauthDialog";
import { QrCanvas } from "@/components/logbook/QrCanvas";
import { CountdownTimer } from "@/components/logbook/CountdownTimer";
import { useIssueSigningToken } from "@/hooks/useSigning";
import { t } from "@/lib/i18n";

const SignDiveTool = () => {
  const navigate = useNavigate();
  const issue = useIssueSigningToken();
  const [reauthOpen, setReauthOpen] = useState(false);
  const [ticket, setTicket] = useState<{ token: string; expires_at: string } | null>(null);

  const handleConfirm = async (password: string) => {
    const t_token = await issue.mutateAsync(password);
    setTicket(t_token);
  };

  const restart = () => {
    setTicket(null);
    setReauthOpen(true);
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/tools")}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight">{t("sdtTitle")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("sdtSubtitle")}
          </p>
        </div>
      </header>

      {!ticket ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-secondary/60 border border-border p-4">
            <p className="text-sm font-semibold">{t("sdtHow")}</p>
            <ol className="text-xs text-foreground/85 mt-2 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>{t("sdtStep1")}</li>
              <li>{t("sdtStep2")}</li>
              <li>{t("sdtStep3")}</li>
              <li>{t("sdtStep4")}</li>
            </ol>
          </div>
          <Button className="w-full h-11 gap-2" onClick={() => setReauthOpen(true)}>
            <QrCode className="w-4 h-4" /> {t("sdtGenerate")}
          </Button>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("sdtFooter")}
          </p>
        </div>
      ) : (
        <div className="card-session !rounded-2xl !p-5 flex flex-col items-center gap-4">
          <div className="p-3 rounded-2xl bg-white">
            <QrCanvas value={ticket.token} size={260} />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--card-muted))]">{t("sdtValidFor")}</p>
            <p className="text-2xl font-bold text-card-foreground">
              <CountdownTimer expiresAt={ticket.expires_at} onExpire={() => setTicket(null)} />
            </p>
            <p className="text-xs text-[hsl(var(--card-muted))] mt-1">
              {t("sdtSingleUse")}
            </p>
          </div>
          <Button variant="outline" className="w-full h-10 gap-2" onClick={restart}>
            <RefreshCcw className="w-4 h-4" /> {t("sdtNewCode")}
          </Button>
        </div>
      )}

      <PasswordReauthDialog
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        title={t("sdtGenerate")}
        description={t("sdtReauthDesc")}
        confirmLabel={t("sdtReauthConfirm")}
        onConfirm={handleConfirm}
      />
    </AppLayout>
  );
};

export default SignDiveTool;
