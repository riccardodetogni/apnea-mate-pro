import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl: string | null;
  name: string;
  uploadPath: string;
  onUpload: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-20 h-20",
  lg: "w-24 h-24",
};

const iconSizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export const AvatarUpload = ({
  currentUrl,
  name,
  uploadPath,
  onUpload,
  size = "md",
  className,
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "L'immagine deve essere inferiore a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setUploading(true);

    try {
      // Generate unique filename with timestamp
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${uploadPath}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache buster to URL
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      onUpload(publicUrl);

      toast({
        title: "Foto aggiornata!",
        description: "La tua immagine è stata caricata con successo",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setPreviewUrl(null);
      toast({
        title: "Errore durante il caricamento",
        description: error.message || "Riprova più tardi",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
      >
        <Avatar className={cn(sizeClasses[size], "border-2 border-card")}>
          <AvatarImage src={displayUrl || undefined} alt={name} />
          <AvatarFallback className="avatar-gradient text-white text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-full flex items-center justify-center transition-all",
            uploading
              ? "bg-background/70"
              : "bg-background/0 group-hover:bg-background/50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <div
              className={cn(
                "rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                iconSizeClasses[size]
              )}
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
