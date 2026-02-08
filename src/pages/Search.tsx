import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Search as SearchIcon, 
  ChevronLeft, 
  MapPin,
  Calendar,
  Users,
  UserPlus,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";

interface PersonResult {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  avatar_url: string | null;
  nextSession?: {
    title: string;
    date_time: string;
    spots_left: number;
  } | null;
  sharedGroup?: {
    name: string;
  } | null;
  isCertified: boolean;
  isFollowing: boolean;
}

interface GroupResult {
  id: string;
  name: string;
  location: string;
  members_count: number;
  verified: boolean;
}

interface SessionResult {
  id: string;
  title: string;
  date_time: string;
  level: string;
  spot_name: string | null;
}

interface SpotResult {
  id: string;
  name: string;
  location: string;
  environment_type: string;
}

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const initialType = searchParams.get("type") || "people";
  const initialQuery = searchParams.get("q") || "";
  
  const [activeTab, setActiveTab] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [spots, setSpots] = useState<SpotResult[]>([]);

  const searchPeople = async (q: string) => {
    if (!q.trim()) {
      setPeople([]);
      return;
    }

    const pattern = `%${q}%`;

    // Get profiles with search_visibility=true
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, name, location, avatar_url")
      .eq("search_visibility", true)
      .ilike("name", pattern)
      .limit(20);

    if (!profiles || profiles.length === 0) {
      setPeople([]);
      return;
    }

    // Get roles for these users
    const userIds = profiles.map(p => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Get current user's follows
    let followingIds: string[] = [];
    if (user) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", userIds);
      
      followingIds = follows?.map(f => f.following_id) || [];
    }

    // Get current user's groups for shared group detection
    let currentUserGroupIds: string[] = [];
    if (user) {
      const { data: memberGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      
      currentUserGroupIds = memberGroups?.map(g => g.group_id) || [];
    }

    // Build results with preview data
    const results: PersonResult[] = await Promise.all(
      profiles.map(async (p) => {
        // Check if certified
        const userRoles = roles?.filter(r => r.user_id === p.user_id) || [];
        const isCertified = userRoles.some(r => 
          r.role === "certified" || r.role === "instructor" || r.role === "admin"
        );

        // Get next public session
        const { data: nextSession } = await supabase
          .from("sessions")
          .select("title, date_time, max_participants")
          .eq("creator_id", p.user_id)
          .eq("is_public", true)
          .eq("status", "active")
          .gte("date_time", new Date().toISOString())
          .order("date_time", { ascending: true })
          .limit(1)
          .maybeSingle();

        // Check for shared group
        let sharedGroup = null;
        if (user && currentUserGroupIds.length > 0) {
          const { data: targetGroups } = await supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", p.user_id)
            .in("group_id", currentUserGroupIds)
            .limit(1);
          
          if (targetGroups && targetGroups.length > 0) {
            const { data: groupData } = await supabase
              .from("groups")
              .select("name")
              .eq("id", targetGroups[0].group_id)
              .single();
            
            sharedGroup = groupData;
          }
        }

        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          location: p.location,
          avatar_url: p.avatar_url,
          nextSession: nextSession ? {
            title: nextSession.title,
            date_time: nextSession.date_time,
            spots_left: nextSession.max_participants,
          } : null,
          sharedGroup,
          isCertified,
          isFollowing: followingIds.includes(p.user_id),
        };
      })
    );

    setPeople(results);
  };

  const searchGroups = async (q: string) => {
    if (!q.trim()) {
      setGroups([]);
      return;
    }

    const pattern = `%${q}%`;
    const { data } = await supabase
      .from("groups")
      .select("id, name, location, verified")
      .eq("is_public", true)
      .ilike("name", pattern)
      .limit(20);

    if (data) {
      // Get member counts
      const groupIds = data.map(g => g.id);
      const counts: Record<string, number> = {};
      
      for (const gid of groupIds) {
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", gid);
        counts[gid] = count || 0;
      }

      setGroups(
        data.map(g => ({
          id: g.id,
          name: g.name,
          location: g.location,
          verified: g.verified ?? false,
          members_count: counts[g.id] || 0,
        }))
      );
    }
  };

  const searchSessions = async (q: string) => {
    if (!q.trim()) {
      setSessions([]);
      return;
    }

    const pattern = `%${q}%`;
    const { data } = await supabase
      .from("sessions")
      .select(`
        id,
        title,
        date_time,
        level,
        spots:spot_id (name)
      `)
      .eq("is_public", true)
      .eq("status", "active")
      .gte("date_time", new Date().toISOString())
      .ilike("title", pattern)
      .order("date_time", { ascending: true })
      .limit(20);

    if (data) {
      setSessions(
        data.map((s: any) => ({
          id: s.id,
          title: s.title,
          date_time: s.date_time,
          level: s.level,
          spot_name: s.spots?.name || null,
        }))
      );
    }
  };

  const searchSpots = async (q: string) => {
    if (!q.trim()) {
      setSpots([]);
      return;
    }

    const pattern = `%${q}%`;
    const { data } = await supabase
      .from("spots")
      .select("id, name, location, environment_type")
      .or(`name.ilike.${pattern},location.ilike.${pattern}`)
      .limit(20);

    if (data) {
      setSpots(data);
    }
  };

  const performSearch = async (q: string, tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case "people":
          await searchPeople(q);
          break;
        case "groups":
          await searchGroups(q);
          break;
        case "sessions":
          await searchSessions(q);
          break;
        case "spots":
          await searchSpots(q);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, activeTab);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ type: activeTab, q: query });
    performSearch(query, activeTab);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ type: tab, q: query });
    if (query) {
      performSearch(query, tab);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    const person = people.find(p => p.user_id === userId);
    if (!person) return;

    if (person.isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: userId });
    }

    setPeople(prev =>
      prev.map(p =>
        p.user_id === userId ? { ...p, isFollowing: !p.isFollowing } : p
      )
    );
  };

  const tabLabels = {
    people: language === "it" ? "Persone" : "People",
    groups: language === "it" ? "Gruppi" : "Groups",
    sessions: language === "it" ? "Sessioni" : "Sessions",
    spots: "Spot",
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/community")}
          className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">
          {language === "it" ? "Cerca" : "Search"}
        </h1>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-10 bg-card"
          />
        </div>
      </form>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-4">
          <TabsTrigger value="people">{tabLabels.people}</TabsTrigger>
          <TabsTrigger value="groups">{tabLabels.groups}</TabsTrigger>
          <TabsTrigger value="sessions">{tabLabels.sessions}</TabsTrigger>
          <TabsTrigger value="spots">{tabLabels.spots}</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* People */}
            <TabsContent value="people" className="space-y-3">
              {people.length === 0 && query && (
                <p className="text-center text-muted py-8">
                  {language === "it" ? "Nessun risultato" : "No results"}
                </p>
              )}
              {people.map(person => (
                <div key={person.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#234567] flex items-center justify-center text-lg font-bold text-white shrink-0">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{person.name}</p>
                        {person.isCertified && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                            {language === "it" ? "Certificato" : "Certified"}
                          </span>
                        )}
                      </div>
                      {person.location && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {person.location}
                        </p>
                      )}
                      
                      {/* Preview snippet */}
                      {person.nextSession && (
                        <div className="mt-2 text-xs text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {language === "it" ? "Prossima sessione:" : "Next session:"}{" "}
                            {format(new Date(person.nextSession.date_time), "d MMM", {
                              locale: language === "it" ? it : enUS
                            })}
                          </span>
                        </div>
                      )}
                      {!person.nextSession && person.sharedGroup && (
                        <div className="mt-2 text-xs text-muted flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {language === "it" ? "Gruppo in comune:" : "Shared group:"}{" "}
                            {person.sharedGroup.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {user && (
                      <Button
                        variant={person.isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollow(person.user_id)}
                        className="flex-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        {person.isFollowing
                          ? (language === "it" ? "Seguito" : "Following")
                          : (language === "it" ? "Segui" : "Follow")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/users/${person.user_id}`)}
                      className="flex-1"
                    >
                      {t("goToProfile")}
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Groups */}
            <TabsContent value="groups" className="space-y-3">
              {groups.length === 0 && query && (
                <p className="text-center text-muted py-8">
                  {language === "it" ? "Nessun risultato" : "No results"}
                </p>
              )}
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="w-full bg-card rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{group.name}</p>
                    {group.verified && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {t("verifiedClub")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {group.location}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {group.members_count} {t("members")}
                  </p>
                </button>
              ))}
            </TabsContent>

            {/* Sessions */}
            <TabsContent value="sessions" className="space-y-3">
              {sessions.length === 0 && query && (
                <p className="text-center text-muted py-8">
                  {language === "it" ? "Nessun risultato" : "No results"}
                </p>
              )}
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="w-full bg-card rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-semibold text-foreground">{session.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(session.date_time), "d MMM, HH:mm", {
                        locale: language === "it" ? it : enUS
                      })}
                    </span>
                    {session.spot_name && (
                      <>
                        <span>•</span>
                        <span>{session.spot_name}</span>
                      </>
                    )}
                  </div>
                  <span className="inline-block text-xs bg-secondary px-2 py-0.5 rounded-full mt-2">
                    {session.level}
                  </span>
                </button>
              ))}
            </TabsContent>

            {/* Spots */}
            <TabsContent value="spots" className="space-y-3">
              {spots.length === 0 && query && (
                <p className="text-center text-muted py-8">
                  {language === "it" ? "Nessun risultato" : "No results"}
                </p>
              )}
              {spots.map(spot => (
                <button
                  key={spot.id}
                  onClick={() => navigate("/spots")}
                  className="w-full bg-card rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-semibold text-foreground">{spot.name}</p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {spot.location}
                  </p>
                  <span className="inline-block text-xs bg-secondary px-2 py-0.5 rounded-full mt-2">
                    {spot.environment_type}
                  </span>
                </button>
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </AppLayout>
  );
};

export default Search;
