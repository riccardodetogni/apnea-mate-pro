import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";

type AuthMode = "login" | "register" | "forgotPassword";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="absolute top-4 right-4 z-10">
      <button
        type="button"
        onClick={() => setLanguage(language === "it" ? "en" : "it")}
        className="flex items-center gap-1 rounded-full border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={language === "it" ? "text-foreground font-semibold" : ""}>IT</span>
        <span className="text-border">|</span>
        <span className={language === "en" ? "text-foreground font-semibold" : ""}>EN</span>
      </button>
    </div>
  );
};

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !password) {
      toast({
        title: "Errore",
        description: "Inserisci email e password",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }

    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) {
        toast({
          title: "Errore",
          description: "Inserisci nome e cognome",
          variant: "destructive",
        });
        return;
      }
      if (firstName.trim().length > 60 || lastName.trim().length > 60) {
        toast({
          title: "Errore",
          description: "Nome e cognome devono essere massimo 60 caratteri",
          variant: "destructive",
        });
        return;
      }
      if (!birthDate) {
        toast({
          title: "Errore",
          description: "Inserisci la tua data di nascita",
          variant: "destructive",
        });
        return;
      }
      const dob = new Date(birthDate);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        toast({
          title: "Errore",
          description: "Inserisci una data di nascita valida",
          variant: "destructive",
        });
        return;
      }
      if (calculateAge(birthDate) < 18) {
        toast({
          title: "Errore",
          description: "Devi avere almeno 18 anni per registrarti",
          variant: "destructive",
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: "Errore",
          description: "Le password non coincidono",
          variant: "destructive",
        });
        return;
      }
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
        const { error } = await signIn(trimmedEmail, password);
        if (error) {
          let errorMessage = error.message;
          if (error.message === "Invalid login credentials") {
            errorMessage = "Credenziali non valide";
            setNeedsConfirmation(false);
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Email non confermata. Controlla la tua casella di posta.";
            setNeedsConfirmation(true);
          } else {
            setNeedsConfirmation(false);
          }
          toast({
            title: "Errore di accesso",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          setNeedsConfirmation(false);
        }
      } else {
        const { error } = await signUp(trimmedEmail, password, {
          name: firstName.trim(),
          lastName: lastName.trim(),
          birthDate,
        });
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
          // Registration successful - show confirmation screen
          setConfirmationSent(true);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast({
        title: "Errore",
        description: "Inserisci la tua email",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: t("resetLinkSent"),
          description: t("resetLinkSentDesc"),
        });
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

  const switchToLogin = () => {
    setMode("login");
    setResetEmailSent(false);
    setConfirmationSent(false);
    setNeedsConfirmation(false);
  };

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
      });
      if (error) {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email inviata",
          description: "Ti abbiamo re-inviato il link di conferma. Controlla la casella (e lo spam).",
        });
        setNeedsConfirmation(false);
      }
    } catch {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  // Email Confirmation Sent View
  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageToggle />
        <div className="w-full max-w-[380px] animate-fade-in text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Controlla la tua email
          </h1>
          <p className="text-sm text-muted mb-4">
            Ti abbiamo inviato un link per confermare il tuo account.
          </p>
          <p className="text-sm text-muted mb-6">
            Email inviata a <strong className="text-foreground">{email}</strong>
          </p>
          <div className="bg-card border rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-card-foreground/70">
              📧 Controlla anche la cartella spam<br/>
              ⏱️ Il link scade tra 24 ore<br/>
              ✅ Dopo la conferma, potrai accedere
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12"
            onClick={switchToLogin}
          >
            <ArrowLeft className="w-5 h-5" />
            Torna al login
          </Button>
        </div>
      </div>
    );
  }

  // Forgot Password View
  if (mode === "forgotPassword") {
    if (resetEmailSent) {
      return (
         <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative">
           <LanguageToggle />
           <div className="w-full max-w-[380px] animate-fade-in text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {t("resetLinkSent")}
            </h1>
            <p className="text-sm text-muted mb-6">
              {t("resetLinkSentDesc")}
            </p>
            <p className="text-sm text-muted mb-6">
              Abbiamo inviato un'email a <strong className="text-foreground">{email}</strong>
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12"
              onClick={switchToLogin}
            >
              <ArrowLeft className="w-5 h-5" />
              {t("backToLogin")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageToggle />
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <Logo variant="app" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">
              {t("resetPassword")}
            </h1>
            <p className="text-sm text-muted mt-1">
              {t("resetPasswordSubtitle")}
            </p>
          </div>

          {/* Email form */}
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario@esempio.it"
                className="rounded-xl h-12"
                autoFocus
              />
            </div>

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
              {loading ? t("loading") : t("sendResetLink")}
            </Button>
          </form>

          <p className="text-center text-sm mt-6">
            <button
              type="button"
              onClick={switchToLogin}
              className="text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToLogin")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Login/Register View
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative">
      <LanguageToggle />
      <div className="w-full max-w-[380px] animate-fade-in">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <Logo variant="app" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? t("welcomeBack") : t("createAccount")}
          </h1>
          <p className="text-sm text-muted mt-1">
            {mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mario"
                    maxLength={60}
                    autoComplete="given-name"
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rossi"
                    maxLength={60}
                    autoComplete="family-name"
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data di nascita</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="rounded-xl h-12"
                />
                <p className="text-xs text-muted">Devi avere almeno 18 anni.</p>
              </div>
            </>
          )}

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

        {mode === "login" && needsConfirmation && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm text-card-foreground mb-3">
              Non hai ricevuto l'email di conferma?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-10"
              onClick={handleResendConfirmation}
              disabled={resending}
            >
              {resending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {resending ? "Invio in corso..." : "Reinvia email di conferma"}
            </Button>
          </div>
        )}

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
              onClick={() => setMode("forgotPassword")}
              className="text-muted hover:text-foreground transition-colors"
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
