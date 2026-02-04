import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGroupDetails } from "@/hooks/useGroupDetails";
import { GroupHeroCard } from "@/components/groups/GroupHeroCard";
import { GroupMembersSection } from "@/components/groups/GroupMembersSection";
import { GroupSessionsList } from "@/components/groups/GroupSessionsList";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { ArrowLeft, Share2, Settings, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { group, members, sessions, loading, error, joinGroup, leaveGroup } = useGroupDetails(id);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: group?.name,
        text: group?.description || `Unisciti al gruppo ${group?.name}`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiato!" });
    }
  };

  const handleJoin = async () => {
    const { error } = await joinGroup();
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Iscrizione effettuata!" });
    }
  };

  const handleLeave = async () => {
    const { error } = await leaveGroup();
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hai lasciato il gruppo" });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !group) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted">{t("error")}</p>
          <Button variant="outline" onClick={() => navigate("/groups")} className="mt-4">
            {t("back")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/groups")}
          className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1" />
        {group.is_admin && (
          <button
            onClick={() => {/* TODO: manage group */}}
            className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Hero Card */}
      <GroupHeroCard
        name={group.name}
        location={group.location}
        memberCount={group.member_count}
        activityType={group.activity_type}
        avatarUrl={group.avatar_url}
        isVerified={group.creator_is_instructor}
        isInstructorLed={group.creator_is_instructor}
        groupType={group.group_type}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {user && !group.is_member ? (
          <Button onClick={handleJoin} className="flex-1 gap-2">
            <UserPlus className="w-4 h-4" />
            {group.requires_approval ? t("joinGroup") : t("join")}
          </Button>
        ) : user && group.is_member && !group.is_admin ? (
          <Button onClick={handleLeave} variant="outline" className="flex-1 gap-2">
            <UserMinus className="w-4 h-4" />
            Lascia gruppo
          </Button>
        ) : null}
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Condividi
        </Button>
      </div>

      {/* Description */}
      {group.description && (
        <div className="mt-6">
          <h3 className="text-base font-semibold text-foreground mb-2">{t("groupDescription")}</h3>
          <p className="text-sm text-muted leading-relaxed">{group.description}</p>
        </div>
      )}

      {/* Tags */}
      {group.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {group.tags.map((tag, index) => (
            <span key={index} className="badge-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Sessions */}
      <div className="mt-6">
        <GroupSessionsList sessions={sessions} />
      </div>

      {/* Courses placeholder */}
      <div className="mt-6 space-y-3">
        <h3 className="text-base font-semibold text-foreground">{t("activeCourses")}</h3>
        <div className="p-4 rounded-xl bg-muted/20 text-center">
          <p className="text-sm text-muted">Nessun corso attivo</p>
        </div>
      </div>

      {/* Members */}
      <div className="mt-6 pb-6">
        <GroupMembersSection
          members={members}
          totalCount={group.member_count}
          onViewAll={() => {/* TODO: view all members */}}
        />
      </div>
    </AppLayout>
  );
};

export default GroupDetails;
