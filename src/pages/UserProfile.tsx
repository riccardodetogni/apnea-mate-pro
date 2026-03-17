import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFollow } from "@/hooks/useFollow";
import { usePersonalBests, hasAnyPB } from "@/hooks/usePersonalBests";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CertificationBadge } from "@/components/certification/CertificationStatus";
import { PersonalBestsCard } from "@/components/profile/PersonalBestsCard";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { 
  ChevronLeft,
  MapPin, 
  Calendar,
  Users,
  Loader2,
  UserPlus,
  UserMinus,
  AlertCircle,
  MessageCircle,
  Star,
  Pencil,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { getOrCreateDMConversation } from "@/hooks/useConversations";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const { reviews, stats, myReview, canReview, submitReview, deleteReview } = useReviews(id);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);

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
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
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
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
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
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        <h1 className="font-semibold text-lg">{t("profile")}</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Profile card */}
        <div className="card-session !rounded-2xl !p-0 text-center mb-6">
          <div className="relative z-[1] p-6">
          <div className="w-20 h-20 mx-auto rounded-full avatar-gradient flex items-center justify-center text-2xl font-bold text-white mb-4">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <h2 className="text-xl font-bold text-card-foreground">{profile.name}</h2>
          
          {profile.location && (
            <p className="text-sm text-[hsl(var(--card-muted))] flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
            </p>
          )}

          {profile.bio && (
            <p className="text-sm text-[hsl(var(--card-muted))] mt-3 leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {isCertified && <CertificationBadge certified={true} />}
            {profile.has_insurance && (
              <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                {profile.insurance_provider ? `${profile.insurance_provider} ${t("insured")}` : t("insured")}
              </span>
            )}
            <span className="text-xs text-[hsl(var(--card-muted))] bg-[hsl(var(--badge-blue-bg))] px-2 py-1 rounded-full">
              {roleLabels[role] || roleLabels.regular}
            </span>
          </div>

          {/* Followers count */}
          <p className="text-sm text-[hsl(var(--card-muted))] mt-3">
            <span className="font-medium text-card-foreground">{followersCount}</span> {language === "it" ? "follower" : "followers"}
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

          {/* DM Button */}
          {user && !isOwnProfile && (
            <Button
              variant="outline"
              className="mt-2 w-full gap-2"
              onClick={async () => {
                try {
                  const convId = await getOrCreateDMConversation(user.id, id!);
                  navigate(`/messages/${convId}`);
                } catch { /* ignore */ }
              }}
            >
              <MessageCircle className="w-4 h-4" />
              {t("sendMessage")}
            </Button>
          )}
          </div>
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
                  className="w-full card-session !rounded-xl !p-3 text-left"
                >
                  <div className="relative z-[1]">
                  <p className="font-medium text-card-foreground text-sm">{group.name}</p>
                  <p className="text-xs text-[hsl(var(--card-muted))]">{group.location}</p>
                  </div>
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
            <div className="card-session !rounded-xl !p-0 text-center">
              <div className="relative z-[1] p-4">
              <p className="text-sm text-[hsl(var(--card-muted))]">
                {language === "it" ? "Nessuna sessione pubblica in programma" : "No upcoming public sessions"}
              </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="w-full card-session !rounded-xl !p-0 text-left"
                >
                  <div className="relative z-[1] p-4">
                  <p className="font-medium text-card-foreground">{session.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--card-muted))]">
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
                    <span className="text-xs bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--card-soft))] px-2 py-0.5 rounded-full">{session.session_type}</span>
                    <span className="text-xs bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--card-soft))] px-2 py-0.5 rounded-full">{session.level}</span>
                  </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted flex items-center gap-2">
              <Star className="w-4 h-4" />
              {t("reviews")}
            </h3>
            {stats.count > 0 && (
              <ReviewSummary average={stats.average} count={stats.count} />
            )}
          </div>

          {/* Leave / Edit review button */}
          {user && !isOwnProfile && canReview && (
            <Button
              variant="outline"
              className="w-full mb-3 gap-2"
              onClick={() => setReviewSheetOpen(true)}
            >
              <Star className="w-4 h-4" />
              {myReview ? t("editReview") : t("leaveReview")}
            </Button>
          )}

          {reviews.length === 0 ? (
            <div className="card-session !rounded-xl !p-0 text-center">
              <div className="relative z-[1] p-4">
                <p className="text-sm text-[hsl(var(--card-muted))]">{t("noReviews")}</p>
              </div>
            </div>
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
      </div>

      {/* Review Sheet */}
      <Sheet open={reviewSheetOpen} onOpenChange={setReviewSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{myReview ? t("editReview") : t("leaveReview")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ReviewForm
              initialRating={myReview?.rating || 0}
              initialComment={myReview?.comment || ""}
              isEditing={!!myReview}
              onSubmit={async (rating, comment) => {
                await submitReview.mutateAsync({ rating, comment });
                setReviewSheetOpen(false);
              }}
              onDelete={myReview ? async () => {
                await deleteReview.mutateAsync();
                setReviewSheetOpen(false);
              } : undefined}
              onCancel={() => setReviewSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UserProfile;
