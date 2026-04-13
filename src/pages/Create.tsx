import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { t } from "@/lib/i18n";
import { Calendar, Users, BarChart3, ChevronLeft, Ticket, GraduationCap } from "lucide-react";

const createOptions = [
  { 
    id: "session", 
    icon: Calendar, 
    label: "createSession",
    descKey: "createSessionDesc",
    iconClass: "bg-[hsl(185,57%,52%)]/20 text-[hsl(185,57%,52%)]",
  },
  { 
    id: "event", 
    icon: Ticket, 
    label: "createEvent",
    descKey: "createEventDesc",
    iconClass: "bg-purple-500/20 text-purple-400",
  },
  { 
    id: "course", 
    icon: GraduationCap, 
    label: "createCourse",
    descKey: "createCourseDesc",
    iconClass: "bg-emerald-500/20 text-emerald-400",
  },
  { 
    id: "group", 
    icon: Users, 
    label: "createGroup",
    descKey: "createGroupDesc",
    iconClass: "bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)]",
  },
  { 
    id: "training", 
    icon: BarChart3, 
    label: "createTraining",
    descKey: "createTrainingDesc",
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
      case "event":
        navigate("/create/event");
        break;
      case "course":
        navigate("/create/course");
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
        {createOptions.map(({ id, icon: Icon, label, descKey, iconClass }) => (
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
                <p className="text-sm text-[hsl(var(--card-muted))] mt-0.5">{t(descKey as any)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
};

export default Create;
