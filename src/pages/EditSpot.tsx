import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import SpotCreator from "@/components/spots/SpotCreator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const EditSpot = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useProfile();
  const [loading, setLoading] = useState(true);
  const [spot, setSpot] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("spots")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error(t("error"));
        navigate(`/spots/${id}`);
        return;
      }
      if (data.created_by !== user?.id && !isAdmin) {
        toast.error(t("accessDenied"));
        navigate(`/spots/${id}`);
        return;
      }
      setSpot(data);
      setLoading(false);
    })();
  }, [id, user?.id, isAdmin, navigate]);

  const handleSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ["spots"] });
    navigate(`/spots/${id}`);
  };

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/spots/${id}`)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{t("editSpot")}</h1>
      </div>
      {loading || !spot ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <SpotCreator
          mode="edit"
          spotId={spot.id}
          hideHeader
          initialValues={{
            name: spot.name,
            location: spot.location,
            environment_type: spot.environment_type,
            description: spot.description,
            latitude: spot.latitude != null ? Number(spot.latitude) : null,
            longitude: spot.longitude != null ? Number(spot.longitude) : null,
          }}
          onSpotCreated={handleSaved}
          onCancel={() => navigate(`/spots/${id}`)}
        />
      )}
    </AppLayout>
  );
};

export default EditSpot;