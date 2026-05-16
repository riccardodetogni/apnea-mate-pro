import { useEffect, useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram } from "lucide-react";
import { BrandIcon, BrandIconName } from "@/components/brand/BrandIcon";

const LAUNCH_DATE = new Date("2026-05-21T22:00:00Z"); // 22 May 2026 00:00 Europe/Rome (CEST = UTC+2)

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Inserisci un'email valida" })
  .max(255, { message: "Email troppo lunga" });

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

const computeRemaining = (): Remaining => {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
};

const pad = (n: number) => n.toString().padStart(2, "0");

const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center min-w-[68px] sm:min-w-[96px]">
    <div
      className="rounded-2xl px-3 py-3 sm:px-5 sm:py-4 w-full text-center"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span className="block text-3xl sm:text-5xl font-bold tabular-nums text-white">
        {pad(value)}
      </span>
    </div>
    <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/60">
      {label}
    </span>
  </div>
);

const features: Array<{
  icon: BrandIconName;
  title: string;
  desc: string;
}> = [
  { icon: "spot", title: "Trova il tuo spot", desc: "Mappa costruita dagli apneisti, per gli apneisti." },
  { icon: "buddy", title: "Trova il tuo buddy", desc: "Apneisti vicino a te, del tuo livello, disponibili quando lo sei tu." },
  { icon: "gruppi", title: "Trova il tuo gruppo", desc: "Allenarti con continuità è più facile se non lo fai da solo." },
  { icon: "scuole", title: "Trova la tua scuola", desc: "Corsi, istruttori, certificazioni. Tutto in trasparenza." },
];

const ComingSoon = () => {
  const { user, loading } = useAuth();
  const [remaining, setRemaining] = useState<Remaining>(computeRemaining);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/community" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setMessage({ type: "error", text: parsed.error.issues[0].message });
      return;
    }
    setSubmitting(true);
    const normalizedEmail = parsed.data.toLowerCase();
    const { error } = await supabase.from("waitlist").insert({ email: normalizedEmail });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setMessage({ type: "error", text: "Sei già nella lista!" });
      } else {
        setMessage({ type: "error", text: "Qualcosa è andato storto. Riprova." });
      }
      return;
    }
    // Fire-and-forget confirmation email — never block UX on it.
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "waitlist-confirmation",
          recipientEmail: normalizedEmail,
          idempotencyKey: `waitlist-${normalizedEmail}`,
        },
      })
      .catch((err) => console.warn("waitlist email send failed", err));
    setEmail("");
    setMessage({ type: "success", text: "Perfetto! Ti avviseremo il giorno del lancio." });
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(210 70% 22%) 0%, hsl(222 47% 11%) 55%, hsl(222 47% 7%) 100%)",
      }}
    >
      {/* Decorative underwater glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 80%, hsl(185 80% 50% / 0.18), transparent 45%), radial-gradient(circle at 80% 20%, hsl(222 90% 55% / 0.16), transparent 45%)",
        }}
      />

      <main className="relative w-full max-w-3xl flex flex-col items-center text-center">
        <Logo variant="symbol" className="w-20 h-20 sm:w-24 sm:h-24 mb-6" />

        <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white max-w-2xl">
          L'apnea non si fa da soli.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-white/70 max-w-xl">
          Sta arrivando l'app per trovare buddy, gruppi, spot e scuole. Iscriviti per essere tra i primi a entrare.
        </p>

        {/* Countdown */}
        <div className="mt-8 sm:mt-10 flex items-center justify-center gap-2 sm:gap-4">
          <CountdownBlock value={remaining.days} label="Giorni" />
          <CountdownBlock value={remaining.hours} label="Ore" />
          <CountdownBlock value={remaining.minutes} label="Minuti" />
          <CountdownBlock value={remaining.seconds} label="Secondi" />
        </div>

        {/* Email capture */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-md flex flex-col gap-2"
        >
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={255}
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/15 text-white placeholder:text-white/40 h-12"
            aria-label="La tua email"
          />
          <p className="text-[12px] text-white/60 text-center sm:text-left">
            Niente spam. Solo un'email quando l'app è pronta.
          </p>
          <Button
            type="submit"
            disabled={submitting}
            variant="primaryGradient"
            className="h-12 px-5 shrink-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entra nella prima ondata"}
          </Button>
        </form>
        {message && (
          <p
            className={`mt-3 text-sm ${
              message.type === "success" ? "text-emerald-300" : "text-red-300"
            }`}
            role="status"
          >
            {message.text}
          </p>
        )}

        {/* Feature teasers */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-4 text-left"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="mb-2 flex items-center" aria-hidden>
                {f.icon === "training" ? (
                  <span className="text-2xl leading-none">📊</span>
                ) : (
                  <BrandIcon name={f.icon} variant="color" size={40} />
                )}
              </div>
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-xs text-white/60 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social footer */}
        <footer className="mt-12 flex items-center gap-4 text-white/60">
          {/* TODO: replace with real Apnea Mate Instagram URL when available */}
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-white transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <span className="text-xs">© {new Date().getFullYear()} Apnea Mate s.r.l.s.</span>
        </footer>
      </main>
    </div>
  );
};

export default ComingSoon;