import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppLayout hideNav>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card-session w-full text-center items-center !p-6 gap-4">
          <div className="avatar-gradient w-16 h-16 rounded-full flex items-center justify-center">
            <Compass className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
          <h1
            className="text-6xl font-bold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #3fbdc8, #3f66e8)" }}
          >
            404
          </h1>
          <h2 className="text-xl font-semibold text-card-foreground">
            {t("errorPageNotFoundTitle")}
          </h2>
          <p className="text-sm text-white/65 max-w-xs">
            {t("errorPageNotFoundDesc")}
          </p>
          <div className="flex flex-col gap-2 w-full pt-2">
            <Button
              variant="primaryGradient"
              size="lg"
              onClick={() => navigate("/community")}
            >
              <Home className="h-4 w-4" />
              {t("errorBackToCommunity")}
            </Button>
            <Button
              variant="pillOutline"
              size="lg"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("errorGoBack")}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
