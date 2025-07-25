
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Rooms from "@/pages/rooms";
import Bookings from "@/pages/bookings";
import Cleaning from "@/pages/cleaning";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Membership from "@/pages/membership";
import Tracker from "@/pages/tracker";
import Navigation from "@/components/navigation";
import ProtectedRoute from "@/components/protected-route";
import Inquiries from "./pages/inquiries";

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        {/* Public routes */}
        <Route path="/login" component={Login} />
        <Route path="/membership" component={Membership} />
        <Route path="/tracker/:token" component={Tracker} />

        {/* Protected routes with navigation */}
        <Route path="/" component={() => (
          <ProtectedRoute>
            <Navigation />
            <Dashboard />
          </ProtectedRoute>
        )} />
        <Route path="/dashboard" component={() => (
          <ProtectedRoute>
            <Navigation />
            <Dashboard />
          </ProtectedRoute>
        )} />
        <Route path="/rooms" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Navigation />
            <Rooms />
          </ProtectedRoute>
        )} />
        <Route path="/inquiries" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Navigation />
            <Inquiries />
          </ProtectedRoute>
        )} />
        <Route path="/bookings" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Navigation />
            <Bookings />
          </ProtectedRoute>
        )} />
        <Route path="/cleaning" component={() => (
          <ProtectedRoute>
            <Navigation />
            <Cleaning />
          </ProtectedRoute>
        )} />
        <Route path="/payments" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Navigation />
            <Payments />
          </ProtectedRoute>
        )} />
        <Route path="/reports" component={() => (
          <ProtectedRoute requiredRoles={['admin']}>
            <Navigation />
            <Reports />
          </ProtectedRoute>
        )} />

        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
