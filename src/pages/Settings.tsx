import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { ChevronLeft, Loader2, Save, User, MapPin, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [name, setName] = useState(profile?.name || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setLocation(profile.location || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: language === "it" ? "Errore" : "Error",
        description: language === "it" ? "Il nome è obbligatorio" : "Name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      name: name.trim(),
      location: location.trim() || null,
      bio: bio.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast({
        title: language === "it" ? "Errore" : "Error",
        description: language === "it" ? "Impossibile salvare le modifiche" : "Failed to save changes",
        variant: "destructive",
      });
    } else {
      toast({
        title: language === "it" ? "Salvato" : "Saved",
        description: language === "it" ? "Profilo aggiornato con successo" : "Profile updated successfully",
      });
      navigate("/profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("settings")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto space-y-6">
        {/* Edit Profile Section */}
        <div className="bg-card rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            {language === "it" ? "Modifica Profilo" : "Edit Profile"}
          </h2>

          <div className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <AvatarUpload
                currentUrl={avatarUrl}
                name={profile?.name || "U"}
                uploadPath={user?.id || ""}
                onUpload={async (url) => {
                  setAvatarUrl(url);
                  await updateProfile({ avatar_url: url });
                }}
                size="lg"
              />
              <p className="text-xs text-muted">
                {language === "it" ? "Tocca per cambiare foto" : "Tap to change photo"}
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {language === "it" ? "Nome" : "Name"}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "it" ? "Il tuo nome" : "Your name"}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {language === "it" ? "Località" : "Location"}
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={language === "it" ? "Es. Roma, Italia" : "E.g. Rome, Italy"}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Bio
              </Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={language === "it" ? "Racconta qualcosa di te..." : "Tell something about yourself..."}
                maxLength={300}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none h-24"
              />
              <p className="text-xs text-muted text-right">{bio.length}/300</p>
            </div>
          </div>

          <Button
            className="w-full mt-6 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {language === "it" ? "Salva modifiche" : "Save changes"}
          </Button>
        </div>

        {/* Future settings sections can go here */}
        <p className="text-sm text-muted text-center">
          {language === "it" 
            ? "Altre impostazioni saranno disponibili presto" 
            : "More settings coming soon"}
        </p>
      </div>
    </div>
  );
};

export default Settings;
