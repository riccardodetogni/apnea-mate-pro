import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePersonalBests } from "@/hooks/usePersonalBests";
import { PersonalBestsForm } from "@/components/profile/PersonalBestsForm";
import { 
  User, 
  MapPin, 
  Award, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Check,
  Upload,
  AlertTriangle,
  Loader2,
  Navigation,
  Trophy,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const certificationAgencies = [
  "AIDA",
  "SSI",
  "PADI",
  "CMAS",
  "Molchanovs",
  "Apnea Academy",
  "Altro",
];

const Onboarding = () => {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [isCertified, setIsCertified] = useState<boolean | null>(null);
  const [agency, setAgency] = useState("");
  const [level, setLevel] = useState("");
  const [certId, setCertId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  
  const { user } = useAuth();
  const { profile, submitCertification, refreshProfile } = useProfile();
  const { personalBests, upsertPersonalBests } = usePersonalBests();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = pos.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=it`
      );
      const data = await response.json();

      // Extract city and region
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;
      const state = data.address?.state || data.address?.region;
      const locationStr = [city, state].filter(Boolean).join(", ");
      
      if (locationStr) {
        setLocation(locationStr);
        toast({
          title: "Posizione rilevata",
          description: locationStr,
        });
      } else {
        toast({
          title: "Posizione non trovata",
          description: "Inserisci manualmente la tua località",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      toast({
        title: "Impossibile rilevare la posizione",
        description: "Assicurati di aver concesso i permessi di localizzazione",
        variant: "destructive",
      });
    } finally {
      setLocationLoading(false);
    }
  };


  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setLocation(profile.location || "");
    }
  }, [profile]);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast({
          title: "Nome richiesto",
          description: "Inserisci il tuo nome per continuare",
          variant: "destructive",
        });
        return;
      }
      if (!location.trim()) {
        toast({
          title: "Località richiesta",
          description: "Inserisci la tua città o regione per continuare",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 2 && isCertified === null) {
      toast({
        title: "Seleziona un'opzione",
        description: "Indica se sei un apneista certificato",
        variant: "destructive",
      });
      return;
    }

    // Validate step 3 - certification details required if user is certified
    if (step === 3 && isCertified === true) {
      if (!agency) {
        toast({
          title: "Agenzia richiesta",
          description: "Seleziona l'agenzia di certificazione",
          variant: "destructive",
        });
        return;
      }
      if (!level.trim()) {
        toast({
          title: "Livello richiesto",
          description: "Inserisci il livello di certificazione",
          variant: "destructive",
        });
        return;
      }
    }

    if (step < 5) {
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
    if (step === 5 && isCertified === false) {
      setStep(4); // PB step
    } else if (step === 4 && isCertified === false) {
      setStep(2);
    } else if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          location: location || null,
          bio: bio.trim() || null,
          has_insurance: hasInsurance,
          insurance_provider: hasInsurance ? (insuranceProvider.trim() || null) : null,
        })
        .eq("user_id", user.id);

      if (profileError) {
        throw profileError;
      }

      // Submit certification if provided
      if (isCertified && agency && level) {
        let documentUrl: string | undefined;

        if (file) {
          const fileExt = file.name.split(".").pop();
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("certifications")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("certifications")
              .getPublicUrl(filePath);
            documentUrl = urlData.publicUrl;
          }
        }

        await submitCertification({
          agency,
          level,
          certification_id: certId || undefined,
          document_url: documentUrl,
        });
      }

      await refreshProfile();
      
      toast({
        title: "Profilo completato!",
        description: "Benvenuto in Apnea Mate",
      });
      
      navigate("/community");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il profilo. Riprova.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size <= 5 * 1024 * 1024) {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast({
        title: "File troppo grande",
        description: "Il file non può superare i 5MB",
        variant: "destructive",
      });
    }
  };

  const stepIcons = {
    1: User,
    2: Award,
    3: Award,
    4: Trophy,
    5: Shield,
  };

  const StepIcon = stepIcons[step];
  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="w-full max-w-[380px] mx-auto flex-1 flex flex-col">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
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
            {step === 4 && t("onboardingStepPB")}
            {step === 5 && t("onboardingStep4")}
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
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Racconta qualcosa di te..."
                  maxLength={300}
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none h-24"
                />
                <p className="text-xs text-muted text-right">{bio.length}/300</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t("location")}</Label>
                <div className="flex gap-2">
                  <LocationAutocomplete
                    value={location}
                    onChange={setLocation}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl flex-shrink-0"
                    onClick={handleUseMyLocation}
                    disabled={locationLoading}
                    title="Usa la mia posizione"
                  >
                    {locationLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Navigation className="w-5 h-5" />
                    )}
                  </Button>
                </div>
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

              {/* Insurance section */}
              <div className="mt-6 p-4 rounded-2xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{t("hasInsurance")}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hasInsurance}
                    onClick={() => {
                      setHasInsurance(!hasInsurance);
                      if (hasInsurance) setInsuranceProvider("");
                    }}
                    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${hasInsurance ? "bg-primary" : "bg-input"}`}
                  >
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${hasInsurance ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {hasInsurance && (
                  <Input
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    placeholder={t("insuranceExample")}
                    className="rounded-xl h-12"
                    maxLength={100}
                  />
                )}
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
                <label className="block w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted hover:text-primary transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">{file ? file.name : "Carica documento"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted text-center mb-2">
                {t("updateLater")}
              </p>
              <PersonalBestsForm
                personalBests={personalBests}
                onSave={async (values) => {
                  const result = await upsertPersonalBests(values);
                  if (!result.error) {
                    setStep(5);
                  }
                  return result;
                }}
                compact
              />
            </div>
          )}

          {step === 5 && (
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
              disabled={saving}
            >
              <ChevronLeft className="w-5 h-5" />
              {t("back")}
            </Button>
          )}

          {step < 5 ? (
            <Button
              variant="primaryGradient"
              size="lg"
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl"
            >
              {step === 4 ? (t("skip")) : t("next")}
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="primaryGradient"
              size="lg"
              onClick={handleComplete}
              className="flex-1 h-12 rounded-xl"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {t("iUnderstand")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
