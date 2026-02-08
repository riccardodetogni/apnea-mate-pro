import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Loader2, Award } from "lucide-react";

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
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: "Il file non può superare i 5MB",
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
        title: "Campi obbligatori",
        description: "Seleziona agenzia e livello di certificazione",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let documentUrl: string | undefined;

      // Upload file if provided
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
        title: "Certificazione inviata",
        description: "La tua richiesta è in attesa di approvazione",
      });

      await refreshProfile();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting certification:", error);
      toast({
        title: "Errore",
        description: "Impossibile inviare la certificazione",
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
          <h3 className="font-semibold text-foreground">Invia certificazione</h3>
          <p className="text-sm text-muted">Sarà verificata dal nostro team</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Agenzia di certificazione *</Label>
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
        <Label htmlFor="level">Livello di certificazione *</Label>
        <Input
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="es. AIDA 2, SSI Level 1"
          className="rounded-xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="certId">ID certificazione (opzionale)</Label>
        <Input
          id="certId"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="es. AIDA-12345"
          className="rounded-xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>Documento (opzionale)</Label>
        <label className="block w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted hover:text-primary transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          <span className="text-sm">
            {file ? file.name : "Carica certificato"}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <p className="text-xs text-muted">Formati: immagine o PDF (max 5MB)</p>
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
            Annulla
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
            "Invia richiesta"
          )}
        </Button>
      </div>
    </form>
  );
};
