import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { Loader2 } from "lucide-react";

const RequireStaff = ({ children }: { children: ReactNode }) => {
  const { isStaff, loading } = useStaffAccess();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isStaff) return <Navigate to="/tools" replace />;
  return <>{children}</>;
};

export default RequireStaff;
