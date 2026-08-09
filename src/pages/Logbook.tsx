import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Plus, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiveLogs } from "@/hooks/useDiveLogs";
import { DiveLogRow } from "@/components/logbook/DiveLogRow";
import { LogbookLegalDisclaimer } from "@/components/logbook/LogbookLegalDisclaimer";
import { downloadLogbookPdf } from "@/lib/logbookPdf";
import { downloadLogbookXlsx } from "@/lib/logbookXlsx";
import { toast } from "sonner";

const Logbook = () => {
  const navigate = useNavigate();
  const { data: logs = [], isLoading } = useDiveLogs();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [xlsxBusy, setXlsxBusy] = useState(false);

  const handleExport = async () => {
    setPdfBusy(true);
    try {
      await downloadLogbookPdf({ type: "logbook_all", filename: "logbook.pdf" });
    } catch (err) {
      toast.error(t("lbExportFailed"));
      console.error("logbook pdf export failed", err);
    } finally {
      setPdfBusy(false);
    }
  };


  const handleExportXlsx = async () => {
    setXlsxBusy(true);
    try {
      await downloadLogbookXlsx({ type: "libretto", filename: "libretto-immersioni.xlsx" });
    } catch (err) {
      toast.error(t("lbExportFailed"));
      console.error("logbook xlsx export failed", err);
    } finally {
      setXlsxBusy(false);
    }
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground leading-tight">{t("lbHeader")}</h1>
          <p className="text-xs text-muted-foreground">{t("lbSubtitle")}</p>
        </div>
        <button
          onClick={() => navigate("/logbook/new")}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
          aria-label={t("lbNewRecordAria")}
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="mb-4">
        <LogbookLegalDisclaimer />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("lbYourDives")}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {logs.length} {t("lbRecordCount")}
        </span>
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card-empty text-center py-8">
          <p className="font-medium text-foreground">{t("lbEmpty")}</p>
          <p className="text-xs mt-1">{t("lbEmptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <DiveLogRow key={log.id} log={log} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleExport}
          disabled={pdfBusy || logs.length === 0}
        >
          <Download className="w-4 h-4" />
          {pdfBusy ? t("lbExporting") : t("lbExportAll")}
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2 mt-2"
          onClick={handleExportXlsx}
          disabled={xlsxBusy || logs.length === 0}
        >
          <FileSpreadsheet className="w-4 h-4" />
          {xlsxBusy ? t("lbExporting") : t("lbExportXlsx")}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Logbook;
