import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePersonalBests } from "@/hooks/usePersonalBests";
import { useReviews } from "@/hooks/useReviews";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { CertificationStatusBadge, CertificationBadge } from "@/components/certification/CertificationStatus";
import { CertificationForm } from "@/components/certification/CertificationForm";
import { PersonalBestsCard } from "@/components/profile/PersonalBestsCard";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { ReviewCard } from "@/components/reviews/ReviewCard";

import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { 
  Settings, 
  LogOut, 
  MapPin, 
  ChevronLeft,
  Globe,
  Shield,
  Loader2,
  Plus,
  Eye,
  Pencil,
  Star,
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
  const { personalBests, upsertPersonalBests, toggleVisibility } = usePersonalBests();
  const { reviews, stats } = useReviews(user?.id);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [certDialogOpen, setCertDialogOpen] = useState(false);

  // Inline edit state
  const [editField, setEditField] = useState<"name" | "bio" | "location" | null>(null);
  


  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleLanguage = () => {
    setLanguage(language === "it" ? "en" : "it");
  };

  const handleFieldSave = async (value: string) => {
    if (!editField) return;
    const update: Record<string, any> = {};
    if (editField === "name") update.name = value;
    else if (editField === "bio") update.bio = value || null;
    else if (editField === "location") update.location = value || null;
    await updateProfile(update);
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
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">{t("profile")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Profile card */}
        <div className="card-session !rounded-2xl !p-6 text-center mb-6">
          {/* Tappable Avatar */}
          <div className="flex justify-center mb-4">
            <AvatarUpload
              currentUrl={profile.avatar_url}
              name={profile.name}
              uploadPath={user.id}
              onUpload={async (url) => {
                await updateProfile({ avatar_url: url });
              }}
              size="lg"
            />
          </div>
          
          {/* Tappable Name */}
          <button
            onClick={() => setEditField("name")}
            className="inline-flex items-center gap-1.5 group"
          >
            <h2 className="text-xl font-bold text-card-foreground">{profile.name}</h2>
            <Pencil className="w-3.5 h-3.5 text-[hsl(var(--card-muted))] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          {/* Location: tappable or add button */}
          {profile.location ? (
            <button
              onClick={() => setEditField("location")}
              className="flex items-center justify-center gap-1 mt-1 group mx-auto"
            >
              <MapPin className="w-3.5 h-3.5 text-[hsl(var(--card-muted))]" />
              <span className="text-sm text-[hsl(var(--card-muted))]">{profile.location}</span>
              <Pencil className="w-3 h-3 text-[hsl(var(--card-muted))] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <button
              onClick={() => setEditField("location")}
              className="flex items-center justify-center gap-1 mt-2 text-sm text-primary mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              {language === "it" ? "Aggiungi località" : "Add location"}
            </button>
          )}

          {/* Bio: tappable or add button */}
          {profile.bio ? (
            <button
              onClick={() => setEditField("bio")}
              className="block w-full text-left mt-3 group"
            >
              <p className="text-sm text-[hsl(var(--card-muted))] leading-relaxed">{profile.bio}</p>
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {language === "it" ? "Modifica" : "Edit"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setEditField("bio")}
              className="flex items-center justify-center gap-1 mt-3 text-sm text-primary mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              {language === "it" ? "Aggiungi bio" : "Add bio"}
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mt-3">
            {isCertified && <CertificationBadge certified={true} />}
            <span className="text-xs text-[hsl(var(--card-muted))] bg-[hsl(var(--badge-blue-bg))] px-2 py-1 rounded-full">
              {roleLabels[role]}
            </span>
          </div>

          {certification && (certification.status === "approved") && (
            <p className="text-sm text-[hsl(var(--card-muted))] mt-2">
              {certification.agency} · {certification.level}
            </p>
          )}
        </div>

        {/* Certification Status */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t("certification")}</h3>
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

        {/* Personal Bests */}
        <div className="mb-6">
          <PersonalBestsCard
            pbs={personalBests}
            editable
            onToggleVisibility={(show) => toggleVisibility(show)}
            onSaveField={async (key, value) => {
              await upsertPersonalBests({ [key]: value });
            }}
          />
        </div>

        {/* My Reviews */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              {t("reviews")}
            </h3>
            {stats.count > 0 && (
              <ReviewSummary average={stats.average} count={stats.count} />
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.created_at}
                />
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="card-session !rounded-2xl !p-0 overflow-hidden">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full p-4 flex items-center gap-3 hover:bg-[hsl(var(--badge-blue-bg))] transition-colors border-b border-[hsl(var(--card-border))]"
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-card-foreground font-medium">{t("adminDashboard")}</span>
            </button>
          )}

          {/* Search Visibility Toggle */}
          <div className="w-full p-4 flex items-center gap-3 border-b border-[hsl(var(--card-border))]">
            <Eye className="w-5 h-5 text-[hsl(var(--card-muted))]" />
            <div className="flex-1">
              <span className="text-card-foreground">{language === "it" ? "Visibile nella ricerca" : "Visible in search"}</span>
              <p className="text-xs text-[hsl(var(--card-muted))] mt-0.5">
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
            className="w-full p-4 flex items-center gap-3 hover:bg-[hsl(var(--badge-blue-bg))] transition-colors border-b border-[hsl(var(--card-border))]"
          >
            <Globe className="w-5 h-5 text-[hsl(var(--card-muted))]" />
            <div className="flex-1 text-left">
              <span className="text-card-foreground">Lingua / Language</span>
            </div>
            <span className="text-sm text-[hsl(var(--card-muted))] uppercase">{language}</span>
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

      {/* Inline Edit Dialog */}
      <ProfileEditDialog
        open={editField !== null}
        onOpenChange={(open) => { if (!open) setEditField(null); }}
        field={editField || "name"}
        currentValue={
          editField === "name" ? profile.name :
          editField === "bio" ? (profile.bio || "") :
          editField === "location" ? (profile.location || "") : ""
        }
        onSave={handleFieldSave}
      />


      {/* Certification Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="max-w-[400px] max-h-[85vh] overflow-y-auto">
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
