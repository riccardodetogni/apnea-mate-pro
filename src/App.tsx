import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import RequireAuth from "./components/auth/RequireAuth";
import RequireStaff from "./components/register/RequireStaff";
import ErrorBoundary from "./components/ErrorBoundary";
import EnvBadge from "./components/dev/EnvBadge";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Community = lazy(() => import("./pages/Community"));
const Spots = lazy(() => import("./pages/Spots"));
const SpotDetails = lazy(() => import("./pages/SpotDetails"));
const CreateSpot = lazy(() => import("./pages/CreateSpot"));
const EditSpot = lazy(() => import("./pages/EditSpot"));
const Create = lazy(() => import("./pages/Create"));
const CreateSession = lazy(() => import("./pages/CreateSession"));
const SessionDetails = lazy(() => import("./pages/SessionDetails"));
const EditSession = lazy(() => import("./pages/EditSession"));
const MySessions = lazy(() => import("./pages/MySessions"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetails = lazy(() => import("./pages/GroupDetails"));
const GroupManage = lazy(() => import("./pages/GroupManage"));
const CreateGroup = lazy(() => import("./pages/CreateGroup"));
const Training = lazy(() => import("./pages/Training"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Search = lazy(() => import("./pages/Search"));
const Admin = lazy(() => import("./pages/Admin"));
const DiscoverFreedivers = lazy(() => import("./pages/DiscoverFreedivers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Messages = lazy(() => import("./pages/Messages"));
const ChatThread = lazy(() => import("./pages/ChatThread"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const CreateCourse = lazy(() => import("./pages/CreateCourse"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const CourseDetails = lazy(() => import("./pages/CourseDetails"));
const EditEvent = lazy(() => import("./pages/EditEvent"));
const EditCourse = lazy(() => import("./pages/EditCourse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const AllSessions = lazy(() => import("./pages/AllSessions"));
const FollowingSessions = lazy(() => import("./pages/FollowingSessions"));
const AllEvents = lazy(() => import("./pages/AllEvents"));
const AllCourses = lazy(() => import("./pages/AllCourses"));
const Tools = lazy(() => import("./pages/Tools"));
const Logbook = lazy(() => import("./pages/Logbook"));
const CreateDiveLog = lazy(() => import("./pages/CreateDiveLog"));
const DiveLogDetail = lazy(() => import("./pages/DiveLogDetail"));
const Certifications = lazy(() => import("./pages/Certifications"));
const RegisterList = lazy(() => import("./pages/register/RegisterList"));
const RegisterPermissions = lazy(() => import("./pages/register/RegisterPermissions"));
const RegisterDetail = lazy(() => import("./pages/register/RegisterDetail"));
const AssignGroups = lazy(() => import("./pages/register/AssignGroups"));
const AddGuest = lazy(() => import("./pages/register/AddGuest"));
const CreateRegister = lazy(() => import("./pages/register/CreateRegister"));
const LibrettiIndex = lazy(() => import("./pages/register/LibrettiIndex"));
const LibrettiAnteprima = lazy(() => import("./pages/register/LibrettiAnteprima"));
const SignDiveTool = lazy(() => import("./pages/logbook/SignDiveTool"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const PageSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <EnvBadge />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin-login" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
                <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
                <Route path="/spots" element={<RequireAuth><Spots /></RequireAuth>} />
                <Route path="/spots/new" element={<RequireAuth><CreateSpot /></RequireAuth>} />
                <Route path="/spots/:id" element={<RequireAuth><SpotDetails /></RequireAuth>} />
                <Route path="/spots/:id/edit" element={<RequireAuth><EditSpot /></RequireAuth>} />
                <Route path="/create" element={<RequireAuth><Create /></RequireAuth>} />
                <Route path="/create/session" element={<RequireAuth><CreateSession /></RequireAuth>} />
                <Route path="/sessions/:id" element={<RequireAuth><SessionDetails /></RequireAuth>} />
                <Route path="/sessions/:id/edit" element={<RequireAuth><EditSession /></RequireAuth>} />
               <Route path="/sessions" element={<RequireAuth><AllSessions /></RequireAuth>} />
               <Route path="/sessions/following" element={<RequireAuth><FollowingSessions /></RequireAuth>} />
               <Route path="/events" element={<RequireAuth><AllEvents /></RequireAuth>} />
               <Route path="/courses" element={<RequireAuth><AllCourses /></RequireAuth>} />
                <Route path="/my-sessions" element={<RequireAuth><MySessions /></RequireAuth>} />
                <Route path="/groups" element={<RequireAuth><Groups /></RequireAuth>} />
                <Route path="/groups/:id" element={<RequireAuth><GroupDetails /></RequireAuth>} />
                <Route path="/groups/:id/manage" element={<RequireAuth><GroupManage /></RequireAuth>} />
                <Route path="/create/group" element={<RequireAuth><CreateGroup /></RequireAuth>} />
                <Route path="/training" element={<RequireAuth><Training /></RequireAuth>} />
                <Route path="/tools" element={<RequireAuth><Tools /></RequireAuth>} />
                <Route path="/logbook" element={<RequireAuth><Logbook /></RequireAuth>} />
                <Route path="/logbook/new" element={<RequireAuth><CreateDiveLog /></RequireAuth>} />
                <Route path="/logbook/:id" element={<RequireAuth><DiveLogDetail /></RequireAuth>} />
                <Route path="/certifications" element={<RequireAuth><Certifications /></RequireAuth>} />
                <Route path="/registro" element={<RequireAuth><RequireStaff><RegisterList /></RequireStaff></RequireAuth>} />
                <Route path="/registro/new" element={<RequireAuth><RequireStaff><CreateRegister /></RequireStaff></RequireAuth>} />
                <Route path="/registro/permessi" element={<RequireAuth><RequireStaff><RegisterPermissions /></RequireStaff></RequireAuth>} />
                <Route path="/registro/:id" element={<RequireAuth><RequireStaff><RegisterDetail /></RequireStaff></RequireAuth>} />
                <Route path="/registro/:id/assign" element={<RequireAuth><RequireStaff><AssignGroups /></RequireStaff></RequireAuth>} />
                <Route path="/registro/:id/ospite" element={<RequireAuth><RequireStaff><AddGuest /></RequireStaff></RequireAuth>} />
                <Route path="/registro/:id/libretti" element={<RequireAuth><RequireStaff><LibrettiIndex /></RequireStaff></RequireAuth>} />
                <Route path="/registro/:id/libretti/:groupId" element={<RequireAuth><RequireStaff><LibrettiAnteprima /></RequireStaff></RequireAuth>} />
                <Route path="/tools/sign-dive" element={<RequireAuth><RequireStaff><SignDiveTool /></RequireStaff></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/users/:id" element={<RequireAuth><UserProfile /></RequireAuth>} />
                <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
                <Route path="/discover" element={<RequireAuth><DiscoverFreedivers /></RequireAuth>} />
                <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
                <Route path="/messages/:id" element={<RequireAuth><ChatThread /></RequireAuth>} />
                <Route path="/create/event" element={<RequireAuth><CreateEvent /></RequireAuth>} />
                <Route path="/create/course" element={<RequireAuth><CreateCourse /></RequireAuth>} />
                <Route path="/events/:id" element={<RequireAuth><EventDetails /></RequireAuth>} />
                <Route path="/courses/:id" element={<RequireAuth><CourseDetails /></RequireAuth>} />
                <Route path="/events/:id/edit" element={<RequireAuth><EditEvent /></RequireAuth>} />
                <Route path="/courses/:id/edit" element={<RequireAuth><EditCourse /></RequireAuth>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
