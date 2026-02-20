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
    bubbleStyle: { background: "linear-gradient(135deg, rgba(63,189,200,0.35), rgba(63,102,232,0.20))", color: "hsl(185,57%,62%)" },
  },
  { 
    id: "group", 
    icon: Users, 
    label: "createGroup",
    description: "Crea un gruppo locale di apneisti",
    bubbleStyle: { background: "linear-gradient(135deg, rgba(34,197,94,0.30), rgba(16,185,129,0.15))", color: "hsl(142,71%,55%)" },
  },
  { 
    id: "training", 
    icon: BarChart3, 
    label: "createTraining",
    description: "Registra il tuo allenamento personale",
    bubbleStyle: { background: "linear-gradient(135deg, rgba(245,158,11,0.30), rgba(239,68,68,0.15))", color: "hsl(38,92%,60%)" },
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

      <div className="space-y-3">
        {createOptions.map(({ id, icon: Icon, label, description, bubbleStyle }) => (
          <button
            key={id}
            onClick={() => handleOptionClick(id)}
            className="w-full p-4 rounded-2xl bg-card border border-white/8 hover:border-primary/30 transition-all text-left flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={bubbleStyle}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground">{t(label as any)}</h3>
              <p className="text-sm text-white/55">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
};

export default Create;
