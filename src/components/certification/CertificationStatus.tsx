import { CertificationStatus as Status } from "@/hooks/useProfile";
import { CheckCircle, FileX } from "lucide-react";

interface CertificationStatusProps {
  status: Status | null;
}

const statusConfig: Record<"not_submitted" | "approved", {
  icon: typeof CheckCircle;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  not_submitted: {
    icon: FileX,
    label: "Non inviata",
    description: "Non hai ancora inviato una certificazione",
    color: "text-muted",
    bgColor: "bg-muted/10",
  },
  approved: {
    icon: CheckCircle,
    label: "Approvata",
    description: "La tua certificazione è stata verificata",
    color: "text-success",
    bgColor: "bg-success/10",
  },
};

export const CertificationStatusBadge = ({ status }: CertificationStatusProps) => {
  const effectiveStatus = status === "approved" ? "approved" : "not_submitted";
  const config = statusConfig[effectiveStatus];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <div className="flex-1">
          <p className={`font-medium ${config.color}`}>{config.label}</p>
          <p className="text-sm text-muted">{config.description}</p>
        </div>
      </div>
    </div>
  );
};

export const CertificationBadge = ({ certified }: { certified: boolean }) => {
  if (!certified) return null;

  return (
    <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" />
      Certificato
    </div>
  );
};
