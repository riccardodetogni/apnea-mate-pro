import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  contactOrganiserSuggestions,
  sendContactOrganiserMessage,
  type OrganiserEntityType,
} from "@/lib/contactOrganiser";

interface ContactOrganiserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organiserId: string;
  organiserName: string;
  organiserAvatarUrl?: string | null;
  entityType: OrganiserEntityType;
  entityTitle: string;
}

export const ContactOrganiserSheet = ({
  open,
  onOpenChange,
  organiserId,
  organiserName,
  organiserAvatarUrl,
  entityType,
  entityTitle,
}: ContactOrganiserSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  const suggestions = contactOrganiserSuggestions[entityType];

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      const { conversationId } = await sendContactOrganiserMessage({
        currentUserId: user.id,
        organiserId,
        entityType,
        entityTitle,
        text,
      });
      onOpenChange(false);
      navigate(`/messages/${conversationId}`);
    } catch (e: any) {
      toast({
        title: "Errore",
        description: e?.message || "Impossibile inviare il messaggio.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            {organiserAvatarUrl ? (
              <img src={organiserAvatarUrl} alt={organiserName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full avatar-gradient flex items-center justify-center text-base font-bold text-white">
                {organiserName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <SheetTitle className="text-base">Contatta {organiserName}</SheetTitle>
              <SheetDescription className="text-xs truncate">Riguardo a "{entityTitle}"</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Domande frequenti</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setText(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/40 hover:bg-muted/70 text-foreground border border-border transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrivi il tuo messaggio..."
            rows={4}
            className="resize-none min-w-0"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={sending}>
            Annulla
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSend} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Invia
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};