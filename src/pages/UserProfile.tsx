import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFollow } from "@/hooks/useFollow";
import { usePersonalBests, hasAnyPB } from "@/hooks/usePersonalBests";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CertificationBadge } from "@/components/certification/CertificationStatus";
import { PersonalBestsCard } from "@/components/profile/PersonalBestsCard";
import { 
  ChevronLeft,
  MapPin, 
  Calendar,
  Users,
  Loader2,
  UserPlus,
  UserMinus,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string })?.from || "/community";
  const { user } = useAuth();
  const { language } = useLanguage();
  const { profile, sessions, sharedGroups, role, loading, error, isCertified, isInstructor } = useUserProfile(id);
  const { isFollowing, loading: followLoading, followersCount, toggleFollow, isOwnProfile } = useFollow(id);
  const { personalBests } = usePersonalBests(id);

  const roleLabels: Record<string, string> = {
    regular: language === "it" ? "Utente" : "User",
    certified: language === "it" ? "Apneista Certificato" : "Certified Freediver",
    instructor: language === "it" ? "Istruttore" : "Instructor",
    admin: "Admin",
  };

  // Redirect to own profile
  if (user && id === user.id) {
    navigate("/profile", { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={() => navigate(backPath)}
            className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">{t("profile")}</h1>
        </header>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted mb-4" />
          <p className="text-muted">{language === "it" ? "Utente non trovato" : "User not found"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  // Check if profile is hidden from search
  if (!profile.search_visibility && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={() => navigate(backPath)}
            className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">{t("profile")}</h1>
        </header>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted mb-4" />
          <p className="text-muted">{language === "it" ? "Questo profilo non è pubblico" : "This profile is not public"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            {t("back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={() => navigate(backPath)}
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

          {profile.bio && (
            <p className="text-sm text-muted mt-3 leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex items-center justify-center gap-2 mt-3">
            {isCertified && <CertificationBadge certified={true} />}
            <span className="text-xs text-muted bg-secondary px-2 py-1 rounded-full">
              {roleLabels[role] || roleLabels.regular}
            </span>
          </div>

          {/* Followers count */}
          <p className="text-sm text-muted mt-3">
            <span className="font-medium text-foreground">{followersCount}</span> {language === "it" ? "follower" : "followers"}
          </p>

          {/* Follow button */}
          {user && !isOwnProfile && (
            <Button
              onClick={toggleFollow}
              disabled={followLoading}
              variant={isFollowing ? "outline" : "default"}
              className="mt-4 w-full"
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  {language === "it" ? "Smetti di seguire" : "Unfollow"}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {language === "it" ? "Segui" : "Follow"}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Personal Bests (public) */}
        {personalBests?.show_on_profile && hasAnyPB(personalBests) && (
          <div className="mb-6">
            <PersonalBestsCard pbs={personalBests} />
          </div>
        )}

        {/* Shared groups */}
        {sharedGroups.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {language === "it" ? "Gruppi in comune" : "Shared groups"}
            </h3>
            <div className="space-y-2">
              {sharedGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="w-full bg-card rounded-xl border p-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium text-foreground text-sm">{group.name}</p>
                  <p className="text-xs text-muted">{group.location}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sessions created by this user */}
        <div>
          <h3 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {language === "it" ? "Prossime sessioni pubbliche" : "Upcoming public sessions"}
          </h3>
          
          {sessions.length === 0 ? (
            <div className="bg-card rounded-xl border p-4 text-center">
              <p className="text-sm text-muted">
                {language === "it" ? "Nessuna sessione pubblica in programma" : "No upcoming public sessions"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="w-full bg-card rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium text-foreground">{session.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                    <span>
                      {format(new Date(session.date_time), "d MMM, HH:mm", { 
                        locale: language === "it" ? it : enUS 
                      })}
                    </span>
                    {session.spot && (
                      <>
                        <span>•</span>
                        <span>{session.spot.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{session.session_type}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{session.level}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
