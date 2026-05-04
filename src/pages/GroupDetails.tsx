import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGroupDetails } from "@/hooks/useGroupDetails";
import { GroupHeroCard } from "@/components/groups/GroupHeroCard";
import { GroupMembersSection } from "@/components/groups/GroupMembersSection";
import { GroupMembersSheet } from "@/components/groups/GroupMembersSheet";
import { GroupSessionsList } from "@/components/groups/GroupSessionsList";
import { EventCard } from "@/components/community/EventCard";
import { CourseCard } from "@/components/community/CourseCard";
import { Button } from "@/components/ui/button";
import { t, mapActivityType } from "@/lib/i18n";
import { ArrowLeft, Share2, Settings, UserPlus, UserMinus, Loader2, Clock, MessageCircle, List, CalendarDays } from "lucide-react";
import { SessionCalendar, CalendarSession } from "@/components/sessions/SessionCalendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notifications";
import { getOrCreateGroupConversation } from "@/hooks/useConversations";
import { useEvents } from "@/hooks/useEvents";
import { useCourses } from "@/hooks/useCourses";

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { group, members, sessions, loading, error, joinGroup, leaveGroup, approveMember, rejectMember } = useGroupDetails(id);
  const { events, loading: eventsLoading } = useEvents(id);
  const { courses, loading: coursesLoading } = useCourses(id);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [sessionsView, setSessionsView] = useState<"list" | "calendar">("list");

  const calendarSessions: CalendarSession[] = useMemo(() =>
    sessions.map(s => ({
      id: s.id, title: s.title, date_time: s.date_time,
      status: "available" as const, spotName: s.spot_name,
      sessionType: s.session_type,
    })),
    [sessions]
  );

  // Filter approved members for display
  const approvedMembers = members.filter(m => m.status === 'approved');

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
    const { error, isPending } = await joinGroup();
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else if (isPending) {
      toast({ title: "Richiesta inviata", description: "In attesa di approvazione" });

      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user!.id)
        .single();

      // Create notification for group owner
      await createNotification({
        userId: group!.created_by,
        type: "group_join_request",
        title: "Nuova richiesta di iscrizione",
        message: `${userProfile?.name || "Un utente"} vuole unirsi a "${group!.name}"`,
        metadata: {
          group_id: group!.id,
          group_name: group!.name,
          user_id: user!.id,
          user_name: userProfile?.name || undefined,
        },
      });
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
        {group.is_owner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/groups/${id}/manage`)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Gestisci
          </Button>
        )}
      </div>

      {/* Hero Card */}
      <GroupHeroCard
        name={group.name}
        location={group.location}
        memberCount={group.member_count}
        activityType={mapActivityType(group.activity_type)}
        avatarUrl={group.avatar_url}
        isVerified={group.verified}
        isInstructorLed={group.creator_is_instructor}
        groupType={group.group_type}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {user && !group.is_member && !group.is_pending ? (
          <Button onClick={handleJoin} className="flex-1 gap-2">
            <UserPlus className="w-4 h-4" />
            {group.requires_approval ? t("requestEnrollment") : t("join")}
          </Button>
        ) : user && group.is_pending ? (
          <Button onClick={handleLeave} variant="outline" className="flex-1 gap-2">
            <Clock className="w-4 h-4" />
            {t("cancelRequest")}
          </Button>
        ) : user && group.is_member && !group.is_owner ? (
          <Button onClick={handleLeave} variant="outline" className="flex-1 gap-2">
            <UserMinus className="w-4 h-4" />
            {t("leaveGroup")}
          </Button>
        ) : null}
        {user && group.is_member && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const convId = await getOrCreateGroupConversation(group.id, user.id);
                navigate(`/messages/${convId}`);
              } catch { /* ignore */ }
            }}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {t("chatGroup")}
          </Button>
        )}
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          {t("share")}
        </Button>
      </div>

      {/* Pending requests notice for owners */}
      {group.is_owner && group.pending_count > 0 && (
        <div 
          onClick={() => navigate(`/groups/${id}/manage`)}
          className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 cursor-pointer hover:bg-warning/20 transition-colors"
        >
          <p className="text-sm text-warning font-medium">
            {group.pending_count} {t("pendingApprovalNotice")}
          </p>
        </div>
      )}

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">{t("upcomingSessions")}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setSessionsView("list")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${sessionsView === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSessionsView("calendar")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${sessionsView === "calendar" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>
        {sessionsView === "calendar" ? (
          <SessionCalendar sessions={calendarSessions} navigateFrom={`/groups/${id}`} />
        ) : (
          <GroupSessionsList sessions={sessions} groupId={id} />
        )}
      </div>

      {/* Group Events */}
      <div className="mt-6">
        <h3 className="text-base font-semibold text-foreground mb-3">{t("groupEvents")}</h3>
        {eventsLoading ? (
          <div className="p-4 rounded-xl bg-muted/20 text-center"><p className="text-sm text-muted">{t("loading")}</p></div>
        ) : events.length > 0 ? (
          <div className="scroll-row">
            {events.map(event => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/20 text-center"><p className="text-sm text-muted">{t("noEvents")}</p></div>
        )}
      </div>

      {/* Group Courses */}
      <div className="mt-6 space-y-3">
        <h3 className="text-base font-semibold text-foreground">{t("groupCourses")}</h3>
        {coursesLoading ? (
          <div className="p-4 rounded-xl bg-muted/20 text-center"><p className="text-sm text-muted">{t("loading")}</p></div>
        ) : courses.length > 0 ? (
          <div className="scroll-row">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} onClick={() => navigate(`/courses/${course.id}`)} />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/20 text-center"><p className="text-sm text-muted">{t("noCourses")}</p></div>
        )}
      </div>

      {/* Members */}
      <div className="mt-6 pb-6">
        <GroupMembersSection
          members={approvedMembers}
          totalCount={group.member_count}
          onViewAll={() => setShowMembersSheet(true)}
        />
      </div>

      {/* Members Sheet */}
      <GroupMembersSheet
        open={showMembersSheet}
        onOpenChange={setShowMembersSheet}
        members={approvedMembers}
        totalCount={group.member_count}
        ownerId={group.created_by}
        groupId={id}
      />
    </AppLayout>
  );
};

export default GroupDetails;
