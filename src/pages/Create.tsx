import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { t } from "@/lib/i18n";
import { Calendar, Users, BarChart3 } from "lucide-react";

const createOptions = [
  { 
    id: "session", 
    icon: Calendar, 
    label: "createSession",
    description: "Organizza un allenamento o uscita",
    color: "bg-primary/10 text-primary",
  },
  { 
    id: "group", 
    icon: Users, 
    label: "createGroup",
    description: "Crea un gruppo locale di apneisti",
    color: "bg-success/10 text-success",
  },
  { 
    id: "training", 
    icon: BarChart3, 
    label: "createTraining",
    description: "Registra il tuo allenamento personale",
    color: "bg-warning/10 text-warning",
  },
];

const Create = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <header className="mb-8 text-center pt-4">
        <h1 className="text-2xl font-bold text-foreground">{t("whatCreate")}</h1>
      </header>

      <div className="space-y-3">
        {createOptions.map(({ id, icon: Icon, label, description, color }) => (
          <button
            key={id}
            onClick={() => {}}
            className="w-full p-4 rounded-2xl bg-card border hover:border-primary/30 transition-all text-left flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{t(label as any)}</h3>
              <p className="text-sm text-muted">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
};

export default Create;
