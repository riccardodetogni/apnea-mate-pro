import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setStatus("error");
      return;
    }
    if ((data as any)?.success) setStatus("success");
    else if ((data as any)?.reason === "already_unsubscribed") setStatus("already");
    else setStatus("error");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-10"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(210 70% 22%) 0%, hsl(222 47% 11%) 55%, hsl(222 47% 7%) 100%)",
      }}
    >
      <main className="w-full max-w-md text-center">
        <Logo variant="symbol" className="w-16 h-16 mx-auto mb-6" />
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Verifica del link in corso…</p>
            </div>
          )}
          {status === "valid" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Vuoi cancellarti?</h1>
              <p className="text-white/70 text-sm mb-6">
                Conferma per non ricevere più email da Apnea Mate.
              </p>
              <Button onClick={handleConfirm} variant="primaryGradient" className="w-full h-12">
                Conferma cancellazione
              </Button>
            </>
          )}
          {status === "submitting" && (
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Cancellazione in corso…</p>
            </div>
          )}
          {status === "success" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Fatto ✅</h1>
              <p className="text-white/70 text-sm">
                Sei stato rimosso dalla lista. Non riceverai più email da Apnea Mate.
              </p>
            </>
          )}
          {status === "already" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Già cancellato</h1>
              <p className="text-white/70 text-sm">
                Questo indirizzo è già stato rimosso dalla lista.
              </p>
            </>
          )}
          {status === "invalid" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Link non valido</h1>
              <p className="text-white/70 text-sm">
                Il link di cancellazione non è valido o è scaduto.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Qualcosa è andato storto</h1>
              <p className="text-white/70 text-sm">Riprova più tardi.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Unsubscribe;