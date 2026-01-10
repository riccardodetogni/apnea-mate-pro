import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="app-container">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};
