import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResults {
  sessions: Array<{
    id: string;
    title: string;
    type: "session";
  }>;
  groups: Array<{
    id: string;
    name: string;
    type: "group";
  }>;
  spots: Array<{
    id: string;
    name: string;
    location: string;
    type: "spot";
  }>;
  profiles: Array<{
    id: string;
    user_id: string;
    name: string;
    type: "profile";
  }>;
}

export const useSearch = () => {
  const [results, setResults] = useState<SearchResults>({
    sessions: [],
    groups: [],
    spots: [],
    profiles: [],
  });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults({
        sessions: [],
        groups: [],
        spots: [],
        profiles: [],
      });
      return;
    }

    setLoading(true);

    try {
      const searchPattern = `%${searchQuery}%`;

      // Search sessions
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, title")
        .ilike("title", searchPattern)
        .eq("status", "active")
        .limit(5);

      // Search groups
      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name")
        .ilike("name", searchPattern)
        .eq("is_public", true)
        .limit(5);

      // Search spots
      const { data: spotsData } = await supabase
        .from("spots")
        .select("id, name, location")
        .or(`name.ilike.${searchPattern},location.ilike.${searchPattern}`)
        .limit(5);

      // Search profiles (only those with search_visibility = true)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, user_id")
        .eq("search_visibility", true)
        .ilike("name", searchPattern)
        .limit(5);

      setResults({
        sessions: (sessionsData || []).map(s => ({ ...s, type: "session" as const })),
        groups: (groupsData || []).map(g => ({ ...g, type: "group" as const })),
        spots: (spotsData || []).map(s => ({ ...s, type: "spot" as const })),
        profiles: (profilesData || []).map(p => ({ ...p, type: "profile" as const })),
      });
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults({
      sessions: [],
      groups: [],
      spots: [],
      profiles: [],
    });
  }, []);

  const hasResults = 
    results.sessions.length > 0 ||
    results.groups.length > 0 ||
    results.spots.length > 0 ||
    results.profiles.length > 0;

  return {
    results,
    loading,
    query,
    search,
    clearSearch,
    hasResults,
  };
};
