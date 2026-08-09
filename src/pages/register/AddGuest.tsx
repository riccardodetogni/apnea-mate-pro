import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegisterMutations } from "@/hooks/useDiveRegisters";
import { toast } from "sonner";
import { z } from "zod";
import { t } from "@/lib/i18n";

const AddGuest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addGuest } = useRegisterMutations(id);

  const schema = z.object({
    nome: z.string().trim().min(1, t("agstErrNameRequired")).max(80),
    cognome: z.string().trim().min(1, t("agstErrSurnameRequired")).max(80),
    birthplace: z.string().trim().min(1, t("agstErrBirthplaceRequired")).max(120),
    birthdate: z
      .string()
      .min(1, t("agstErrBirthdateRequired"))
      // A guest cannot be born in the future.
      .refine((v) => v <= new Date().toISOString().slice(0, 10), t("agstErrBirthdateFuture")),
    agency: z.string().max(30),
    brevettoNumber: z.string().trim().max(30),
  });

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [birthplace, setBirthplace] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [agency, setAgency] = useState("");
  const [brevettoNumber, setBrevettoNumber] = useState("");

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ nome, cognome, birthplace, birthdate, agency, brevettoNumber });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!id) return;
    try {
      await addGuest.mutateAsync({ registerId: id, ...parsed.data });
      toast.success(t("agstAdded"));
      navigate(`/registro/${id}`);
    } catch (e: any) {
      toast.error(e.message ?? t("error"));
    }
  };

  return (
    <AppLayout>
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/80 border border-border flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("agstTitle")}</h1>
      </header>

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        {t("agstIntro")}
      </p>

      <div className="card-session !rounded-2xl !p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-card-foreground">{t("agstName")}</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("agstSurname")}</Label>
            <Input value={cognome} onChange={(e) => setCognome(e.target.value)} maxLength={80} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-card-foreground">{t("agstBirthplace")}</Label>
          <Input value={birthplace} onChange={(e) => setBirthplace(e.target.value)} maxLength={120} />
        </div>
        <div>
          <Label className="text-xs text-card-foreground">{t("agstBirthdate")}</Label>
          <Input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs text-card-foreground">{t("agstAgency")}</Label>
          <Select value={agency} onValueChange={setAgency}>
            <SelectTrigger>
              <SelectValue placeholder={t("agstAgencyPh")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AIDA 1">AIDA 1</SelectItem>
              <SelectItem value="AIDA 2">AIDA 2</SelectItem>
              <SelectItem value="AIDA 3">AIDA 3</SelectItem>
              <SelectItem value="AIDA 4">AIDA 4</SelectItem>
              <SelectItem value="Apnea Academy">Apnea Academy</SelectItem>
              <SelectItem value="FIPSAS">FIPSAS</SelectItem>
              <SelectItem value={t("agstOther")}>{t("agstOther")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground">{t("agstBrevettoNumber")}</Label>
          <Input value={brevettoNumber} onChange={(e) => setBrevettoNumber(e.target.value)} maxLength={30} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mt-3 mb-4">
        {t("agstFooter")}
      </p>

      <Button className="w-full h-11" onClick={handleSubmit} disabled={addGuest.isPending}>
        {t("agstSave")}
      </Button>
    </AppLayout>
  );
};

export default AddGuest;
