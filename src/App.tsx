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
import Create from "./pages/Create";
import CreateSession from "./pages/CreateSession";
import SessionDetails from "./pages/SessionDetails";
import MySessions from "./pages/MySessions";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import GroupManage from "./pages/GroupManage";
import CreateGroup from "./pages/CreateGroup";
import Training from "./pages/Training";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import DiscoverFreedivers from "./pages/DiscoverFreedivers";

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
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/community" element={<Community />} />
              <Route path="/spots" element={<Spots />} />
              <Route path="/create" element={<Create />} />
              <Route path="/create/session" element={<CreateSession />} />
              <Route path="/sessions/:id" element={<SessionDetails />} />
              <Route path="/my-sessions" element={<MySessions />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetails />} />
              <Route path="/groups/:id/manage" element={<GroupManage />} />
              <Route path="/create/group" element={<CreateGroup />} />
              <Route path="/training" element={<Training />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users/:id" element={<UserProfile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/discover" element={<DiscoverFreedivers />} />
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
