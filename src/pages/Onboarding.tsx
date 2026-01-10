import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  MapPin, 
  Award, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Check,
  Upload,
  AlertTriangle
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const certificationAgencies = [
  "AIDA",
  "SSI",
  "PADI",
  "CMAS",
  "Molchanovs",
  "Altro",
];

const Onboarding = () => {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isCertified, setIsCertified] = useState<boolean | null>(null);
  const [agency, setAgency] = useState("");
  const [level, setLevel] = useState("");
  const [certId, setCertId] = useState("");
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const totalSteps = isCertified === false ? 4 : isCertified === true ? 4 : 2;

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci il tuo nome per continuare",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && isCertified === null) {
      toast({
        title: "Seleziona un'opzione",
        description: "Indica se sei un apneista certificato",
        variant: "destructive",
      });
      return;
    }

    if (step < 4) {
      if (step === 2 && isCertified === false) {
        setStep(4);
      } else if (step === 2 && isCertified === true) {
        setStep(3);
      } else {
        setStep((step + 1) as Step);
      }
    }
  };

  const handleBack = () => {
    if (step === 4 && isCertified === false) {
      setStep(2);
    } else if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = () => {
    // Save onboarding data to localStorage for now
    const profile = {
      name,
      location,
      isCertified,
      agency: isCertified ? agency : null,
      level: isCertified ? level : null,
      certId: isCertified ? certId : null,
    };
    localStorage.setItem("apnea-mate-profile", JSON.stringify(profile));
    localStorage.setItem("apnea-mate-onboarding-complete", "true");
    
    toast({
      title: "Profilo completato!",
      description: "Benvenuto in Apnea Mate",
    });
    
    navigate("/community");
  };

  const stepIcons = {
    1: User,
    2: Award,
    3: Award,
    4: Shield,
  };

  const StepIcon = stepIcons[step];

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="w-full max-w-[380px] mx-auto flex-1 flex flex-col">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step icon and title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <StepIcon className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {step === 1 && t("onboardingStep1")}
            {step === 2 && t("onboardingStep2")}
            {step === 3 && t("onboardingStep3")}
            {step === 4 && t("onboardingStep4")}
          </h1>
        </div>

        {/* Step content */}
        <div className="flex-1 animate-fade-in">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("yourName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t("location")}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Milano, Lombardia"
                    className="rounded-xl h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("profilePicture")}</Label>
                <button className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-colors">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Carica foto</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-center text-muted mb-6">{t("areCertified")}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsCertified(true)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isCertified === true
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Check className={`w-8 h-8 mx-auto mb-2 ${
                    isCertified === true ? "text-primary" : "text-muted"
                  }`} />
                  <span className={`text-lg font-medium ${
                    isCertified === true ? "text-primary" : "text-foreground"
                  }`}>
                    {t("yes")}
                  </span>
                </button>

                <button
                  onClick={() => setIsCertified(false)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isCertified === false
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <User className={`w-8 h-8 mx-auto mb-2 ${
                    isCertified === false ? "text-primary" : "text-muted"
                  }`} />
                  <span className={`text-lg font-medium ${
                    isCertified === false ? "text-primary" : "text-foreground"
                  }`}>
                    {t("no")}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && isCertified && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("certificationAgency")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {certificationAgencies.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAgency(a)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        agency === a
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">{t("certificationLevel")}</Label>
                <Input
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="es. AIDA 2, SSI Level 1"
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certId">{t("certificationId")}</Label>
                <Input
                  id="certId"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  placeholder="es. AIDA-12345"
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("uploadCertificate")}</Label>
                <button className="w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted hover:text-primary transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Carica documento</span>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-warning-light border border-warning/20">
                <div className="flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-warning-foreground mb-1">
                      {t("safetyTitle")}
                    </h3>
                    <p className="text-sm text-warning-foreground/80">
                      {t("safetyMessage")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-secondary border border-border">
                <p className="text-sm text-muted">
                  {t("safetyDisclaimer")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="flex-1 h-12 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
              {t("back")}
            </Button>
          )}

          {step < 4 ? (
            <Button
              variant="primaryGradient"
              size="lg"
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl"
            >
              {t("next")}
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="primaryGradient"
              size="lg"
              onClick={handleComplete}
              className="flex-1 h-12 rounded-xl"
            >
              <Check className="w-5 h-5" />
              {t("iUnderstand")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
