import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSpots } from "@/hooks/useSpots";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const sessionTypes = [
  { value: "sea_trip", label: "Uscita mare" },
  { value: "pool_session", label: "Piscina" },
  { value: "deep_pool_session", label: "Piscina profonda" },
  { value: "lake_trip", label: "Uscita lago" },
  { value: "training", label: "Allenamento" },
];

const levels = [
  { value: "all_levels", label: "Tutti i livelli" },
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzato" },
];

const CreateSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCertified, isInstructor, loading: profileLoading } = useProfile();
  const { spots, loading: spotsLoading } = useSpots();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    spot_id: "",
    session_type: "sea_trip",
    level: "all_levels",
    date: "",
    time: "",
    duration_minutes: 60,
    max_participants: 6,
  });

  const canCreate = isCertified || isInstructor;

  useEffect(() => {
    if (!user && !profileLoading) {
      navigate("/auth");
    }
  }, [user, profileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !canCreate) return;

    if (!form.title.trim()) {
      toast({ title: "Errore", description: "Inserisci un titolo", variant: "destructive" });
      return;
    }

    if (!form.spot_id) {
      toast({ title: "Errore", description: "Seleziona uno spot", variant: "destructive" });
      return;
    }

    if (!form.date || !form.time) {
      toast({ title: "Errore", description: "Inserisci data e ora", variant: "destructive" });
      return;
    }

    const dateTime = new Date(`${form.date}T${form.time}`);
    if (dateTime <= new Date()) {
      toast({ title: "Errore", description: "La data deve essere nel futuro", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        spot_id: form.spot_id,
        session_type: form.session_type,
        level: form.level,
        date_time: dateTime.toISOString(),
        duration_minutes: form.duration_minutes,
        max_participants: form.max_participants,
        creator_id: user.id,
        is_public: true,
        status: "active",
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error) {
      console.error("Error creating session:", error);
      if (error.message?.includes("row-level security")) {
        toast({
          title: "Non autorizzato",
          description: "Devi essere certificato per creare sessioni",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: error.message || "Impossibile creare la sessione",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Sessione creata!",
        description: "La tua sessione è stata pubblicata",
      });
      navigate(`/sessions/${data.id}`);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-card border flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Nuova sessione</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {!canCreate ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Certificazione richiesta</h3>
            <p className="text-sm text-muted mb-6">
              Per creare sessioni devi essere un apneista certificato o istruttore. Puoi inviare la tua certificazione dal profilo.
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Vai al profilo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                placeholder="Es: Allenamento profondità"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                placeholder="Dettagli aggiuntivi sulla sessione..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Spot */}
            <div className="space-y-2">
              <Label>Spot *</Label>
              <Select value={form.spot_id} onValueChange={(v) => setForm({ ...form, spot_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona uno spot">
                    {form.spot_id && (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {spots.find(s => s.id === form.spot_id)?.name}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {spotsLoading ? (
                    <div className="p-2 text-center text-sm text-muted">Caricamento...</div>
                  ) : (
                    spots.map(spot => (
                      <SelectItem key={spot.id} value={spot.id}>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {spot.name} · {spot.location}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Type & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo sessione</Label>
                <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Livello</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Ora *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="time"
                    type="time"
                    className="pl-10"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Duration & Max Participants */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Durata (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={30}
                  max={480}
                  step={15}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Max partecipanti</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <Input
                    id="max"
                    type="number"
                    min={2}
                    max={50}
                    className="pl-10"
                    value={form.max_participants}
                    onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 6 })}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primaryGradient"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creazione...
                </>
              ) : (
                "Pubblica sessione"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateSession;
