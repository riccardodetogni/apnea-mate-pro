import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, MapPin, Award, UserCheck, Users } from "lucide-react";
import { useDiscoverFreedivers, SuggestedUser } from "@/hooks/useDiscoverFreedivers";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";

const DiscoverFreedivers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    suggestions,
    loading,
    followingIds,
    followsNobody,
    searchQuery,
    setSearchQuery,
    toggleFollow,
  } = useDiscoverFreedivers();

  const handleFollow = async (user: SuggestedUser) => {
    const { success, isNowFollowing } = await toggleFollow(user.user_id);
    
    if (success) {
      toast({
        title: isNowFollowing ? `Ora segui ${user.name}` : `Non segui più ${user.name}`,
        description: isNowFollowing 
          ? "Le sue sessioni appariranno nella Community" 
          : undefined,
      });
    } else {
      toast({
        title: "Errore",
        description: "Impossibile completare l'azione",
        variant: "destructive",
      });
    }
  };

  const handleGoToProfile = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const getRoleBadge = (role: string | null) => {
    if (role === "instructor") {
      return (
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          <Award className="w-3 h-3 mr-1" />
          {t("instructor")}
        </Badge>
      );
    }
    if (role === "certified") {
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <UserCheck className="w-3 h-3 mr-1" />
          Certificato
        </Badge>
      );
    }
    return null;
  };

  const UserCard = ({ user }: { user: SuggestedUser }) => {
    const isFollowing = followingIds.has(user.user_id);
    
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
              {getRoleBadge(user.role)}
            </div>
            
            {user.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-1">
              🏊 {user.activitySummary}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => handleFollow(user)}
          >
            {isFollowing ? "Seguito" : "Segui"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleGoToProfile(user.user_id)}
          >
            {t("goToProfile")}
          </Button>
        </div>
      </div>
    );
  };

  const UserCardSkeleton = () => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/community")}
          className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Scopri apneisti</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca apneisti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Gentle suggestion for new users */}
      {followsNobody && !loading && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Segui almeno un apneista
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Le sessioni delle persone che segui appariranno nella Community!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section header */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Suggeriti per te
      </h2>

      {/* User list */}
      <div className="space-y-3">
        {loading ? (
          <>
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </>
        ) : suggestions.length > 0 ? (
          suggestions.map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Nessun apneista trovato con questo nome."
                : "Non ci sono altri apneisti da suggerirti al momento."}
            </p>
            {searchQuery && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setSearchQuery("")}
              >
                Mostra tutti i suggerimenti
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DiscoverFreedivers;
