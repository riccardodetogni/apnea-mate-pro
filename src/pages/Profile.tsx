import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { CertificationStatusBadge, CertificationBadge } from "@/components/certification/CertificationStatus";
import { CertificationForm } from "@/components/certification/CertificationForm";
import { 
  Settings, 
  LogOut, 
  MapPin, 
  ChevronLeft,
  Globe,
  Shield,
  Loader2,
  Plus,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const roleLabels = {
  regular: "Utente",
  certified: "Apneista Certificato",
  instructor: "Istruttore",
  admin: "Admin",
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, role, certification, loading, isCertified, isAdmin, updateProfile } = useProfile();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [certDialogOpen, setCertDialogOpen] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleLanguage = () => {
    setLanguage(language === "it" ? "en" : "it");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate("/community")}
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("profile")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Profile card */}
        <div className="bg-card rounded-2xl border p-6 text-center mb-6">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.name}
              className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-card mb-4"
            />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-deep to-primary-light flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          
          {profile.location && (
            <p className="text-sm text-muted flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-3">
            {isCertified && <CertificationBadge certified={true} />}
            <span className="text-xs text-muted bg-secondary px-2 py-1 rounded-full">
              {roleLabels[role]}
            </span>
          </div>

          {certification && (certification.status === "approved") && (
            <p className="text-sm text-muted mt-2">
              {certification.agency} · {certification.level}
            </p>
          )}
        </div>

        {/* Certification Status */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted mb-3">{t("certification")}</h3>
          <CertificationStatusBadge 
            status={certification?.status || null} 
            rejectionReason={certification?.rejection_reason}
          />
          
          {(!certification || certification.status === "rejected") && (
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setCertDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              {t("submitCertification")}
            </Button>
          )}
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl border overflow-hidden">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b"
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">{t("adminDashboard")}</span>
            </button>
          )}

          {/* Search Visibility Toggle */}
          <div className="w-full p-4 flex items-center gap-3 border-b">
            <Eye className="w-5 h-5 text-muted" />
            <div className="flex-1">
              <span className="text-foreground">{language === "it" ? "Visibile nella ricerca" : "Visible in search"}</span>
              <p className="text-xs text-muted mt-0.5">
                {language === "it" 
                  ? "Altri utenti possono trovarti cercando il tuo nome"
                  : "Other users can find you by searching your name"}
              </p>
            </div>
            <Switch
              checked={profile.search_visibility}
              onCheckedChange={async (checked) => {
                await updateProfile({ search_visibility: checked });
              }}
            />
          </div>

          <button
            onClick={toggleLanguage}
            className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b"
          >
            <Globe className="w-5 h-5 text-muted" />
            <div className="flex-1 text-left">
              <span className="text-foreground">Lingua / Language</span>
            </div>
            <span className="text-sm text-muted uppercase">{language}</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b"
          >
            <Settings className="w-5 h-5 text-muted" />
            <span className="text-foreground">{t("settings")}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </div>

      {/* Certification Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("submitCertification")}</DialogTitle>
          </DialogHeader>
          <CertificationForm
            onSuccess={() => setCertDialogOpen(false)}
            onCancel={() => setCertDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
