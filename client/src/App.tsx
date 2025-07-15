import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={LoginPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signin" component={SignInPage} />
          <Route path="/signup" component={SignUpPage} />
          <Route component={LoginPage} />
        </>
      ) : (
        <>
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
        </>
      )}
      <Route component={NotFound} />
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
