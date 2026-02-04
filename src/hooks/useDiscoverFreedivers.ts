import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation, calculateDistance } from "@/hooks/useUserLocation";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface SuggestedUser {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
  role: AppRole | null;
  activitySummary: string;
  score: number;
  distanceKm: number | null;
}

// Scoring weights for prioritization
const WEIGHTS = {
  veryNearbyBonus: 80,    // Within 50km
  nearbyBonus: 50,        // Within 100km
  moderateDistanceBonus: 25, // Within 200km
  sharedGroupBonus: 20,   // Per shared group (max 3)
  instructorBonus: 25,    // Is instructor
  certifiedBonus: 15,     // Is certified
  recentActivityBonus: 10, // Created session in last 30 days
};

// Activity type labels
const activityLabels: Record<string, string> = {
  "deep_pool_session": "Piscina profonda",
  "sea_trip": "Uscite mare",
  "static_session": "Statica",
  "dynamic_session": "Dinamica",
  "pool_training": "Piscina",
  "depth_training": "Profondità",
  "recreational": "Ricreativo",
};

export const useDiscoverFreedivers = () => {
  const { user } = useAuth();
  const { location } = useUserLocation();
  
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followsNobody, setFollowsNobody] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all data and compute scores
  const fetchSuggestions = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // 1. Get users already followed
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followedIds = new Set((followsData || []).map(f => f.following_id));
      setFollowingIds(followedIds);
      setFollowsNobody(followedIds.size === 0);

      // 2. Get candidate profiles (visible, not self, not already followed)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .eq("search_visibility", true)
        .neq("user_id", user.id);

      if (!profilesData || profilesData.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Filter out already followed
      const candidates = profilesData.filter(p => !followedIds.has(p.user_id));

      if (candidates.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const candidateUserIds = candidates.map(c => c.user_id);

      // 3. Get user roles for candidates
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", candidateUserIds);

      const rolesMap = new Map<string, AppRole>(
        (rolesData || []).map(r => [r.user_id, r.role])
      );

      // 4. Get current user's groups for shared group scoring
      const { data: myGroupsData } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "approved");

      const myGroupIds = new Set((myGroupsData || []).map(g => g.group_id));

      // 5. Get group memberships for candidates
      const { data: candidateGroupsData } = await supabase
        .from("group_members")
        .select("user_id, group_id")
        .in("user_id", candidateUserIds)
        .eq("status", "approved");

      // Count shared groups per user
      const sharedGroupsCount = new Map<string, number>();
      (candidateGroupsData || []).forEach(gm => {
        if (myGroupIds.has(gm.group_id)) {
          sharedGroupsCount.set(
            gm.user_id,
            (sharedGroupsCount.get(gm.user_id) || 0) + 1
          );
        }
      });

      // 6. Get recent sessions (last 30 days) for activity summary
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("creator_id, session_type")
        .in("creator_id", candidateUserIds)
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Build activity map
      const activityMap = new Map<string, Map<string, number>>();
      const recentlyActiveUsers = new Set<string>();
      
      (sessionsData || []).forEach(s => {
        recentlyActiveUsers.add(s.creator_id);
        if (!activityMap.has(s.creator_id)) {
          activityMap.set(s.creator_id, new Map());
        }
        const userActivity = activityMap.get(s.creator_id)!;
        userActivity.set(s.session_type, (userActivity.get(s.session_type) || 0) + 1);
      });

      // 7. Score and build suggestions
      const scored: SuggestedUser[] = candidates.map(profile => {
        let score = 0;
        const role = rolesMap.get(profile.user_id) || null;
        
        // Distance scoring
        let distanceKm: number | null = null;
        // Note: profiles don't have lat/lon, so we skip geo-scoring for now
        // In a production app, you might geocode the location string or store coordinates
        
        // Role scoring
        if (role === "instructor") {
          score += WEIGHTS.instructorBonus;
        } else if (role === "certified") {
          score += WEIGHTS.certifiedBonus;
        }

        // Shared groups scoring (max 3)
        const sharedCount = Math.min(sharedGroupsCount.get(profile.user_id) || 0, 3);
        score += sharedCount * WEIGHTS.sharedGroupBonus;

        // Recent activity scoring
        if (recentlyActiveUsers.has(profile.user_id)) {
          score += WEIGHTS.recentActivityBonus;
        }

        // Generate activity summary
        const userActivity = activityMap.get(profile.user_id);
        let activitySummary = "Apneista";
        if (userActivity && userActivity.size > 0) {
          const sorted = Array.from(userActivity.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([type]) => activityLabels[type] || type);
          if (sorted.length > 0) {
            activitySummary = sorted.join(", ");
          }
        }

        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          location: profile.location,
          role,
          activitySummary,
          score,
          distanceKm,
        };
      });

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);

      setSuggestions(scored);
    } catch (err) {
      console.error("Error fetching discover suggestions:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [user, location]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Toggle follow with optimistic update
  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user) return { success: false, isNowFollowing: false };

    const wasFollowing = followingIds.has(targetUserId);

    // Optimistic update
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (wasFollowing) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return next;
    });

    try {
      if (wasFollowing) {
        // Unfollow
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        // Follow
        await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });
      }

      // Update followsNobody state
      setFollowsNobody(followingIds.size === 0 && wasFollowing);

      return { success: true, isNowFollowing: !wasFollowing };
    } catch (err) {
      console.error("Error toggling follow:", err);
      
      // Revert on error
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (wasFollowing) {
          next.add(targetUserId);
        } else {
          next.delete(targetUserId);
        }
        return next;
      });

      return { success: false, isNowFollowing: wasFollowing };
    }
  }, [user, followingIds]);

  // Filter suggestions by search query
  const filteredSuggestions = searchQuery
    ? suggestions.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.location?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : suggestions;

  return {
    suggestions: filteredSuggestions,
    loading,
    followingIds,
    followsNobody,
    searchQuery,
    setSearchQuery,
    toggleFollow,
    refetch: fetchSuggestions,
  };
};
