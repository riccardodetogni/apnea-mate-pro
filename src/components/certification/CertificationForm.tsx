import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Loader2, Award } from "lucide-react";
import { t } from "@/lib/i18n";

const certificationAgencies = [
  "AIDA",
  "Apnea Academy",
  "CMAS",
  "Molchanovs",
  "PADI",
  "SSI",
  "Altro",
];

interface CertificationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CertificationForm = ({ onSuccess, onCancel }: CertificationFormProps) => {
  const { user } = useAuth();
  const { submitCertification, refreshProfile } = useProfile();
  const { toast } = useToast();

  const [agency, setAgency] = useState("");
  const [level, setLevel] = useState("");
  const [certId, setCertId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: t("fileTooLarge"),
          description: t("fileTooLargeDesc"),
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agency || !level) {
      toast({
        title: t("requiredFields"),
        description: t("requiredFieldsDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: t("error"),
        description: t("mustBeAuthenticated"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let documentUrl: string | undefined;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("certifications")
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("certifications")
          .getPublicUrl(filePath);

        documentUrl = urlData.publicUrl;
      }

      const { error } = await submitCertification({
        agency,
        level,
        certification_id: certId || undefined,
        document_url: documentUrl,
      });

      if (error) {
        throw error;
      }

      toast({
        title: t("certificationAdded"),
        description: t("nowCertifiedFreediver"),
      });

      await refreshProfile();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting certification:", error);
      toast({
        title: t("error"),
        description: t("cannotSubmitCert"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl mb-6">
        <Award className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">{t("submitCertificationTitle")}</h3>
          <p className="text-sm text-muted">{t("willBeVerified")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("certAgencyLabel")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {certificationAgencies.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAgency(a)}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                agency === a
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="level">{t("certLevelLabel")}</Label>
        <Input
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder={t("certLevelPlaceholder")}
          className="rounded-xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="certId">{t("certIdLabel")}</Label>
        <Input
          id="certId"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder={t("certIdPlaceholder")}
          className="rounded-xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("documentOptional")}</Label>
        <label className="block w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted hover:text-primary transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          <span className="text-sm">
            {file ? file.name : t("uploadCertificateBtn")}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <p className="text-xs text-muted">{t("formats")}</p>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={loading}
          >
            {t("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          variant="primaryGradient"
          className="flex-1"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t("sendRequest")
          )}
        </Button>
      </div>
    </form>
  );
};