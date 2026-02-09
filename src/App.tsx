import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Community from "./pages/Community";
import Spots from "./pages/Spots";
import SpotDetails from "./pages/SpotDetails";
import Create from "./pages/Create";
import CreateSession from "./pages/CreateSession";
import SessionDetails from "./pages/SessionDetails";
import EditSession from "./pages/EditSession";
import MySessions from "./pages/MySessions";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import GroupManage from "./pages/GroupManage";
import CreateGroup from "./pages/CreateGroup";
import Training from "./pages/Training";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import DiscoverFreedivers from "./pages/DiscoverFreedivers";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/community" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
              <Route path="/spots" element={<RequireAuth><Spots /></RequireAuth>} />
              <Route path="/spots/:id" element={<RequireAuth><SpotDetails /></RequireAuth>} />
              <Route path="/create" element={<RequireAuth><Create /></RequireAuth>} />
              <Route path="/create/session" element={<RequireAuth><CreateSession /></RequireAuth>} />
              <Route path="/sessions/:id" element={<RequireAuth><SessionDetails /></RequireAuth>} />
              <Route path="/sessions/:id/edit" element={<RequireAuth><EditSession /></RequireAuth>} />
              <Route path="/my-sessions" element={<RequireAuth><MySessions /></RequireAuth>} />
              <Route path="/groups" element={<RequireAuth><Groups /></RequireAuth>} />
              <Route path="/groups/:id" element={<RequireAuth><GroupDetails /></RequireAuth>} />
              <Route path="/groups/:id/manage" element={<RequireAuth><GroupManage /></RequireAuth>} />
              <Route path="/create/group" element={<RequireAuth><CreateGroup /></RequireAuth>} />
              <Route path="/training" element={<RequireAuth><Training /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/users/:id" element={<RequireAuth><UserProfile /></RequireAuth>} />
              <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
              <Route path="/discover" element={<RequireAuth><DiscoverFreedivers /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
