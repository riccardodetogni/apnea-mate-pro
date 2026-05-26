import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CoverImageUploadProps {
  currentUrl: string | null;
  uploadPath: string; // folder, typically the user id
  entity: "spot" | "event" | "course";
  onChange: (url: string | null) => void;
  className?: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export const CoverImageUpload = ({
  currentUrl,
  uploadPath,
  entity,
  onChange,
  className,
}: CoverImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const { toast } = useToast();

  const openPicker = () => inputRef.current?.click();

  const extractCoversPath = (url: string): string | null => {
    const marker = "/storage/v1/object/public/covers/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const rest = url.slice(idx + marker.length).split("?")[0];
    return rest || null;
  };

  const handleRemove = async () => {
    if (currentUrl) {
      const path = extractCoversPath(currentUrl);
      if (path) {
        // best-effort; ignore errors
        await supabase.storage.from("covers").remove([path]).catch(() => {});
      }
    }
    onChange(null);
    setSizeError(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSizeError(false);

    if (!ACCEPTED.includes(file.type)) {
      toast({
        title: "Formato non supportato",
        description: "Usa JPG, PNG o WebP.",
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_BYTES) {
      setSizeError(true);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${uploadPath}/${entity}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("covers")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // remove previous cover (best-effort) if it was ours
      if (currentUrl) {
        const prev = extractCoversPath(currentUrl);
        if (prev && prev !== path) {
          await supabase.storage.from("covers").remove([prev]).catch(() => {});
        }
      }

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Cover upload error:", err);
      toast({
        title: "Errore durante il caricamento",
        description: err.message || "Riprova più tardi",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative aspect-video w-full rounded-xl overflow-hidden bg-muted",
          !currentUrl && "border-2 border-dashed border-border"
        )}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              aria-label="Rimuovi foto"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm font-medium">
              Aggiungi una foto di copertina
            </span>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Per un risultato ottimale, carica un'immagine orizzontale in formato 16:9
        (es. 1280x720px o superiore). Immagini verticali o quadrate verranno
        ritagliate ai lati.
      </p>

      {sizeError && (
        <p className="text-xs text-destructive">
          Il file è troppo grande. Dimensione massima: 5MB.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
};

export default CoverImageUpload;