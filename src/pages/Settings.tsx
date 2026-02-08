import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { ChevronLeft } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

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

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        <p className="text-sm text-muted-foreground text-center">
          {language === "it" 
            ? "Le impostazioni del profilo sono ora modificabili direttamente dalla pagina Profilo" 
            : "Profile settings are now editable directly from the Profile page"}
        </p>
      </div>
    </div>
  );
};

export default Settings;
