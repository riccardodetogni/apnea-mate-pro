import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { FeedbackSheet } from "@/components/feedback/FeedbackSheet";

const Settings = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">{t("settings")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto space-y-4">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{t("sendFeedback")}</p>
            <p className="text-xs text-muted-foreground">{t("feedbackSubtitle")}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </button>

        <p className="text-xs text-muted-foreground text-center pt-4">
          {language === "it"
            ? "Le impostazioni del profilo sono modificabili dalla pagina Profilo"
            : "Profile settings are editable from the Profile page"}
        </p>
      </div>

      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};

export default Settings;
