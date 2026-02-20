import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { t } from "@/lib/i18n";
import { Calendar, Users, BarChart3, ChevronLeft } from "lucide-react";

const createOptions = [
  { 
    id: "session", 
    icon: Calendar, 
    label: "createSession",
    description: "Organizza un allenamento o uscita",
    iconClass: "bg-[hsl(185,57%,52%)]/20 text-[hsl(185,57%,52%)]",
  },
  { 
    id: "group", 
    icon: Users, 
    label: "createGroup",
    description: "Crea un gruppo locale di apneisti",
    iconClass: "bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)]",
  },
  { 
    id: "training", 
    icon: BarChart3, 
    label: "createTraining",
    description: "Registra il tuo allenamento personale",
    iconClass: "bg-[hsl(38,92%,50%)]/20 text-[hsl(38,92%,50%)]",
  },
];

const Create = () => {
  const navigate = useNavigate();

  const handleOptionClick = (id: string) => {
    switch (id) {
      case "session":
        navigate("/create/session");
        break;
      case "group":
        navigate("/create/group");
        break;
      case "training":
        navigate("/training");
        break;
    }
  };

  return (
    <AppLayout>
      <header className="mb-6 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/community")}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{t("whatCreate")}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {createOptions.map(({ id, icon: Icon, label, description, iconClass }) => (
          <button
            key={id}
            onClick={() => handleOptionClick(id)}
            className="card-session !rounded-2xl !p-5 text-left"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${iconClass} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground text-base">{t(label as any)}</h3>
                <p className="text-sm text-[hsl(var(--card-muted))] mt-0.5">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
};

export default Create;
