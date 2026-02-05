import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/lib/notifications";

export const useFollow = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchFollowStatus = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) {
      setIsFollowing(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  }, [user, targetUserId]);

  const fetchCounts = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Followers count (people following this user)
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      // Following count (people this user follows)
      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (err) {
      console.error("Error fetching follow counts:", err);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchFollowStatus();
    fetchCounts();
  }, [fetchFollowStatus, fetchCounts]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);

        // Get the current user's profile for the notification
        const { data: followerProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();

        // Create notification for the followed user
        await createNotification({
          userId: targetUserId,
          type: "new_follower",
          title: "Nuovo follower",
          message: `${followerProfile?.name || "Un utente"} ha iniziato a seguirti`,
          metadata: {
            user_id: user.id,
            user_name: followerProfile?.name || undefined,
          },
        });
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      // Revert state on error
      fetchFollowStatus();
      fetchCounts();
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    loading,
    followersCount,
    followingCount,
    toggleFollow,
    isOwnProfile: user?.id === targetUserId,
  };
};
