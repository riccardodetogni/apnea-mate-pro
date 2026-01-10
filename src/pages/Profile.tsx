import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { 
  User, 
  Settings, 
  LogOut, 
  Award, 
  MapPin, 
  ChevronLeft,
  Globe
} from "lucide-react";

interface Profile {
  name: string;
  location: string;
  isCertified: boolean;
  agency: string | null;
  level: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const stored = localStorage.getItem("apnea-mate-profile");
    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("apnea-mate-onboarding-complete");
    navigate("/auth");
  };

  const toggleLanguage = () => {
    setLanguage(language === "it" ? "en" : "it");
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("profile")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Profile card */}
        <div className="bg-card rounded-2xl border p-6 text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-deep to-primary-light flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          
          {profile.location && (
            <p className="text-sm text-muted flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
            </p>
          )}

          {profile.isCertified && (
            <div className="inline-flex items-center gap-1.5 mt-3 py-1.5 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Award className="w-4 h-4" />
              {t("certifiedFreediver")}
            </div>
          )}

          {profile.agency && profile.level && (
            <p className="text-sm text-muted mt-2">
              {profile.agency} · {profile.level}
            </p>
          )}
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl border overflow-hidden">
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

          <button className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b">
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
    </div>
  );
};

export default Profile;
