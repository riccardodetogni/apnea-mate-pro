import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { supabase } from "@/integrations/supabase/client";
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
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
  MapPin,
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

const EditSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, loading, error } = useSessionDetails(id);
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [durationInput, setDurationInput] = useState("60");
  const [participantsInput, setParticipantsInput] = useState("6");
  const [form, setForm] = useState({
    title: "",
    description: "",
    session_type: "sea_trip",
    level: "all_levels",
    date: "",
    time: "",
    duration_minutes: 60,
    max_participants: 6,
  });

  // Pre-populate form when session loads
  useEffect(() => {
    if (session) {
      const dateTime = new Date(session.date_time);
      const dateStr = dateTime.toISOString().split("T")[0];
      const timeStr = dateTime.toTimeString().slice(0, 5);

      setForm({
        title: session.title,
        description: session.description || "",
        session_type: session.session_type,
        level: session.level,
        date: dateStr,
        time: timeStr,
        duration_minutes: session.duration_minutes,
        max_participants: session.max_participants,
      });
      setDurationInput(String(session.duration_minutes));
      setParticipantsInput(String(session.max_participants));
    }
  }, [session]);

  // Redirect if not the creator
  useEffect(() => {
    if (!loading && session && user && session.creator_id !== user.id) {
      navigate(`/sessions/${id}`);
    }
  }, [loading, session, user, id, navigate]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDurationInput(e.target.value);
  };

  const handleDurationBlur = () => {
    const parsed = parseInt(durationInput, 10);
    if (isNaN(parsed) || parsed < 30) {
      setDurationInput("30");
      setForm((prev) => ({ ...prev, duration_minutes: 30 }));
    } else if (parsed > 480) {
      setDurationInput("480");
      setForm((prev) => ({ ...prev, duration_minutes: 480 }));
    } else {
      setDurationInput(String(parsed));
      setForm((prev) => ({ ...prev, duration_minutes: parsed }));
    }
  };

  const handleParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParticipantsInput(e.target.value);
  };

  const handleParticipantsBlur = () => {
    const parsed = parseInt(participantsInput, 10);
    if (isNaN(parsed) || parsed < 2) {
      setParticipantsInput("2");
      setForm((prev) => ({ ...prev, max_participants: 2 }));
    } else if (parsed > 50) {
      setParticipantsInput("50");
      setForm((prev) => ({ ...prev, max_participants: 50 }));
    } else {
      setParticipantsInput(String(parsed));
      setForm((prev) => ({ ...prev, max_participants: parsed }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !session) return;

    if (!form.title.trim()) {
      toast({ title: "Errore", description: "Inserisci un titolo", variant: "destructive" });
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

    // Check if max_participants is less than current confirmed count
    if (form.max_participants < session.confirmedCount) {
      toast({
        title: "Errore",
        description: `Ci sono già ${session.confirmedCount} partecipanti confermati`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          session_type: form.session_type,
          level: form.level,
          date_time: dateTime.toISOString(),
          duration_minutes: form.duration_minutes,
          max_participants: form.max_participants,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Sessione aggiornata!",
        description: "Le modifiche sono state salvate",
      });
      navigate(`/sessions/${id}`);
    } catch (err: any) {
      console.error("Error updating session:", err);
      toast({
        title: "Errore",
        description: err.message || "Impossibile aggiornare la sessione",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-muted mb-4" />
        <h2 className="text-lg font-semibold mb-2">Sessione non trovata</h2>
        <Button variant="outline" onClick={() => navigate("/community")}>
          Torna alla Community
        </Button>
      </div>
    );
  }

  if (!user || session.creator_id !== user.id) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-warning mb-4" />
        <h2 className="text-lg font-semibold mb-2">Non autorizzato</h2>
        <p className="text-sm text-muted mb-4">Solo il creatore può modificare questa sessione</p>
        <Button variant="outline" onClick={() => navigate(`/sessions/${id}`)}>
          Torna alla sessione
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(`/sessions/${id}`)}
          className="w-10 h-10 rounded-full bg-card border flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Modifica sessione</h1>
      </header>

      <div className="px-4 py-6 max-w-[430px] mx-auto">
        {/* Spot info (read-only) */}
        {session.spot && (
          <div className="bg-card rounded-xl border p-4 mb-6">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Spot (non modificabile)</p>
            <p className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {session.spot.name} · {session.spot.location}
            </p>
          </div>
        )}

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

          {/* Type & Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo sessione</Label>
              <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
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
                  {levels.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
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
                value={durationInput}
                onChange={handleDurationChange}
                onBlur={handleDurationBlur}
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
                  value={participantsInput}
                  onChange={handleParticipantsChange}
                  onBlur={handleParticipantsBlur}
                />
              </div>
            </div>
          </div>

          {session.confirmedCount > 0 && (
            <p className="text-xs text-muted">
              Nota: ci sono {session.confirmedCount} partecipanti confermati. Il numero massimo non può essere inferiore.
            </p>
          )}

          {/* Submit */}
          <Button type="submit" variant="primaryGradient" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva modifiche"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditSession;
