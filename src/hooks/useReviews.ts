import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

export interface AnonymousReview {
  id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyReview {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  average: number;
  count: number;
}

export const useReviews = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch anonymous reviews for a user
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anonymous_reviews" as any)
        .select("*")
        .eq("reviewed_user_id", targetUserId!);
      if (error) throw error;
      return (data as unknown as AnonymousReview[]) || [];
    },
    enabled: !!targetUserId,
  });

  // Compute stats
  const stats: ReviewStats = {
    average: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    count: reviews.length,
  };

  // Fetch current user's own review for this target
  const { data: myReview, isLoading: myReviewLoading } = useQuery({
    queryKey: ["my-review", targetUserId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewer_id", user!.id)
        .eq("reviewed_user_id", targetUserId!)
        .maybeSingle();
      if (error) throw error;
      return data as MyReview | null;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  // Check eligibility
  const { data: canReview = false } = useQuery({
    queryKey: ["can-review", targetUserId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_review_user", {
        _reviewer_id: user!.id,
        _target_id: targetUserId!,
      });
      if (error) return false;
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["my-review", targetUserId, user?.id] });
  };

  // Submit or update review
  const submitReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      if (myReview) {
        // Update existing
        const { error } = await supabase
          .from("reviews")
          .update({ rating, comment: comment || null })
          .eq("id", myReview.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("reviews")
          .insert({
            reviewer_id: user!.id,
            reviewed_user_id: targetUserId!,
            rating,
            comment: comment || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(myReview ? t("reviewUpdated") : t("reviewSubmitted"));
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  // Delete review
  const deleteReview = useMutation({
    mutationFn: async () => {
      if (!myReview) return;
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", myReview.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(t("reviewDeleted"));
    },
  });

  return {
    reviews,
    stats,
    myReview,
    canReview,
    loading: reviewsLoading || myReviewLoading,
    submitReview,
    deleteReview,
  };
};
