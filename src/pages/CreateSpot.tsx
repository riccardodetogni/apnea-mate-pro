import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import SpotCreator from "@/components/spots/SpotCreator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

const CreateSpot = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleCreated = async (spotId: string) => {
    await queryClient.invalidateQueries({ queryKey: ["spots"] });
    navigate(`/spots/${spotId}`);
  };

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/spots")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{t("newSpot")}</h1>
      </div>
      <SpotCreator
        mode="create"
        hideHeader
        onSpotCreated={handleCreated}
        onCancel={() => navigate("/spots")}
      />
    </AppLayout>
  );
};

export default CreateSpot;