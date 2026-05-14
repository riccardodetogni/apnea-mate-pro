import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("back")}
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-4">
          {t("privacyPolicyPageTitle")}
        </h1>

        <div className="p-4 rounded-2xl bg-warning-light border border-warning/20 mb-6">
          <p className="text-sm text-warning-foreground">
            {t("privacyPolicyPlaceholderNotice")}
          </p>
        </div>

        <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {t("privacyPolicyPlaceholderBody")}
        </div>

        <p className="mt-8 text-xs text-muted">
          {t("privacyPolicyLastUpdated")}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;