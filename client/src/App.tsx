import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { MobileNavigation } from "@/components/MobileNavigation";

// New organized pages
import {
  LoginPage,
  SignInPage,
  SignUpPage,
  FeedPage,
  ProfilePage,
  MessagesPage,
  ExplorePage,
  NotificationsPage,
  NotFound
} from "@/pages";

// Legacy pages for compatibility
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  const handleNavigateHome = () => setLocation("/feed");
  const handleNavigateExplore = () => setLocation("/explore");
  const handleNavigateMessages = () => setLocation("/messages");
  const handleNavigateProfile = () => setLocation("/profile");
  const handleOpenNotifications = () => setLocation("/notifications");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        onNavigateHome={handleNavigateHome}
        onNavigateExplore={handleNavigateExplore}
        onNavigateMessages={handleNavigateMessages}
        onNavigateProfile={handleNavigateProfile}
        onOpenNotifications={handleOpenNotifications}
      />
      <main className="pt-16 md:pt-16 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNavigation
        onNavigateHome={handleNavigateHome}
        onNavigateExplore={handleNavigateExplore}
        onNavigateMessages={handleNavigateMessages}
        onNavigateProfile={handleNavigateProfile}
        onOpenNotifications={handleOpenNotifications}
      />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={LoginPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signin" component={SignInPage} />
          <Route path="/signup" component={SignUpPage} />
          <Route component={LoginPage} />
        </>
      ) : (
        <AuthenticatedLayout>
          <Switch>
            {/* New organized routes */}
            <Route path="/" component={FeedPage} />
            <Route path="/feed" component={FeedPage} />
            <Route path="/explore" component={ExplorePage} />
            <Route path="/messages" component={MessagesPage} />
            <Route path="/messages/:userId" component={MessagesPage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/profile/:username?" component={ProfilePage} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="/home" component={Home} />
            <Route path="/landing" component={Landing} />
            
            {/* Redirect auth pages to feed when authenticated */}
            <Route path="/login" component={FeedPage} />
            <Route path="/signin" component={FeedPage} />
            <Route path="/signup" component={FeedPage} />
            
            <Route component={NotFound} />
          </Switch>
        </AuthenticatedLayout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
