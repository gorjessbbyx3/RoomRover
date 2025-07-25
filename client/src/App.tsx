import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/membership" component={Membership} />
      <Route path="/tracker/:token" component={Tracker} />

      {/* Protected routes */}
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;