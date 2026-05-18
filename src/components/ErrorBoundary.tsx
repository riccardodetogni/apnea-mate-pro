import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ error: null });
    window.location.href = "/community";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <AppLayout hideNav>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="card-session w-full text-center items-center !p-6 gap-4">
            <div className="avatar-gradient w-16 h-16 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">
              {t("errorSomethingWrong")}
            </h2>
            <p className="text-sm text-white/65 max-w-xs">
              {t("errorSomethingWrongDesc")}
            </p>
            <div className="flex flex-col gap-2 w-full pt-2">
              <Button variant="primaryGradient" size="lg" onClick={this.handleRetry}>
                <RotateCcw className="h-4 w-4" />
                {t("errorTryAgain")}
              </Button>
              <Button variant="pillOutline" size="lg" onClick={this.handleHome}>
                <Home className="h-4 w-4" />
                {t("errorBackToCommunity")}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
}

export default ErrorBoundary;