import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const AppLayout = ({ children, hideNav }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="app-container">
        {children}
      </div>
      {!hideNav && <FeedbackFab />}
      {!hideNav && <BottomNav />}
    </div>
  );
};
