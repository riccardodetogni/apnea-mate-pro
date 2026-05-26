import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CompleteProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLastName: string | null;
  initialBirthDate: string | null;
  onSave: (data: { last_name: string | null; birth_date: string | null }) => Promise<void>;
}

const calculateAge = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const CompleteProfileDialog = ({
  open,
  onOpenChange,
  initialLastName,
  initialBirthDate,
  onSave,
}: CompleteProfileDialogProps) => {
  const { toast } = useToast();
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLastName(initialLastName ?? "");
      setBirthDate(initialBirthDate ?? "");
    }
  }, [open, initialLastName, initialBirthDate]);

  const handleSave = async () => {
    const trimmed = lastName.trim();
    if (!trimmed) {
      toast({ title: "Errore", description: "Inserisci il tuo cognome", variant: "destructive" });
      return;
    }
    if (trimmed.length > 60) {
      toast({ title: "Errore", description: "Il cognome deve essere massimo 60 caratteri", variant: "destructive" });
      return;
    }
    if (!birthDate) {
      toast({ title: "Errore", description: "Inserisci la tua data di nascita", variant: "destructive" });
      return;
    }
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime()) || dob >= new Date()) {
      toast({ title: "Errore", description: "Inserisci una data di nascita valida", variant: "destructive" });
      return;
    }
    if (calculateAge(birthDate) < 18) {
      toast({ title: "Errore", description: "Devi avere almeno 18 anni", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await onSave({ last_name: trimmed, birth_date: birthDate });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Completa il tuo profilo</DialogTitle>
          <DialogDescription>
            Aggiungi cognome e data di nascita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="cp-lastName">Cognome</Label>
            <Input
              id="cp-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Rossi"
              maxLength={60}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-birthDate">Data di nascita</Label>
            <Input
              id="cp-birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            <p className="text-xs text-muted-foreground">Devi avere almeno 18 anni.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};