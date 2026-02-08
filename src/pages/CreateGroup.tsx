import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Focus tags removed per V1 requirements

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [groupType, setGroupType] = useState<"community" | "school">("community");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"open" | "approval">("open");
  const [loading, setLoading] = useState(false);

  const handleGroupTypeChange = (type: "community" | "school") => {
    setGroupType(type);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Devi accedere per creare un gruppo", variant: "destructive" });
      return;
    }

    if (!name.trim() || !location.trim()) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          location: location.trim(),
          description: description.trim() || null,
          activity_type: "Misto",
          group_type: groupType,
          requires_approval: visibility === "approval",
          is_public: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
      });

      toast({ title: "Gruppo creato!" });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      console.error("Error creating group:", err);
      toast({ title: "Errore nella creazione", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("createGroupTitle")}</h1>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome del gruppo *</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("groupNamePlaceholder")}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t("groupMainZone")} *</label>
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={t("groupLocationPlaceholder")}
          
          />
        </div>

        {/* Group Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t("groupTypeLabel")}</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleGroupTypeChange("community")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                groupType === "community"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {t("groupTypeCommunity")}
            </button>
            <button
              onClick={() => handleGroupTypeChange("school")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                groupType === "school"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {t("groupTypeSchool")}
            </button>
          </div>
          {groupType === "school" && (
            <p className="text-xs text-muted mt-2">
              Per diventare partner verificato, contatta il nostro team dopo la creazione.
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t("groupDescription")}</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t("groupDescPlaceholder")}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t("groupVisibility")}</label>
          <div className="flex gap-2">
            <button
              onClick={() => setVisibility("open")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                visibility === "open"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {t("visibilityOpen")}
            </button>
            <button
              onClick={() => setVisibility("approval")}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                visibility === "approval"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {t("visibilityApproval")}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !location.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creazione...
            </>
          ) : (
            t("createGroup")
          )}
        </Button>
      </div>
    </AppLayout>
  );
};

export default CreateGroup;
