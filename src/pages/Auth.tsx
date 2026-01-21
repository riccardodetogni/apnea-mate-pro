import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Waves, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "register";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Check if profile exists by querying the database
      const checkProfile = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, location")
          .eq("user_id", user.id)
          .single();

        // If profile has been completed (has location set), go to community
        if (profile?.location) {
          navigate("/community");
        } else {
          navigate("/onboarding");
        }
      };
      checkProfile();
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Errore",
        description: "Inserisci email e password",
        variant: "destructive",
      });
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non coincidono",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Errore di accesso",
            description: error.message === "Invalid login credentials" 
              ? "Credenziali non valide" 
              : error.message,
            variant: "destructive",
          });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Utente esistente",
              description: "Questo indirizzo email è già registrato. Prova ad accedere.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Errore di registrazione",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Registrazione completata",
            description: "Account creato con successo!",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px] animate-fade-in">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-deep to-primary-light flex items-center justify-center shadow-elevated">
            <Waves className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? t("welcomeBack") : t("createAccount")}
          </h1>
          <p className="text-sm text-muted mt-1">
            {mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@esempio.it"
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl h-12"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl h-12"
              />
            </div>
          )}

          <Button 
            type="submit" 
            variant="primaryGradient"
            size="lg"
            className="w-full h-12 text-base"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {loading ? t("loading") : (mode === "login" ? t("login") : t("register"))}
          </Button>
        </form>

        {/* Switch mode */}
        <p className="text-center text-sm text-muted mt-6">
          {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? t("register") : t("login")}
          </button>
        </p>

        {mode === "login" && (
          <p className="text-center text-sm mt-3">
            <button
              type="button"
              className="text-muted hover:text-foreground"
            >
              {t("forgotPassword")}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
