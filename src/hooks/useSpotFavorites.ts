import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSpotFavorites = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("spot_favorites")
        .select("spot_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setFavoriteIds(data?.map((f) => f.spot_id) || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(
    async (spotId: string) => {
      if (!user) return;

      const isFavorite = favoriteIds.includes(spotId);

      try {
        if (isFavorite) {
          // Remove favorite
          const { error } = await supabase
            .from("spot_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("spot_id", spotId);

          if (error) throw error;

          setFavoriteIds((prev) => prev.filter((id) => id !== spotId));
        } else {
          // Add favorite
          const { error } = await supabase.from("spot_favorites").insert({
            user_id: user.id,
            spot_id: spotId,
          });

          if (error) throw error;

          setFavoriteIds((prev) => [...prev, spotId]);
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    },
    [user, favoriteIds]
  );

  const isFavorite = useCallback(
    (spotId: string) => favoriteIds.includes(spotId),
    [favoriteIds]
  );

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
