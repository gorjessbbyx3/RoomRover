import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/protected-route';
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Rooms from "@/pages/rooms";
import Bookings from "@/pages/bookings";
import Cleaning from "@/pages/cleaning";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Inquiries from "@/pages/inquiries";
import Tracker from "@/pages/tracker";
import Membership from "@/pages/membership";
import UserManagement from '@/pages/user-management';
import InventoryManagement from '@/pages/inventory-management';
import MaintenanceManagement from '@/pages/maintenance-management';
import BannedUsersManagement from '@/pages/banned-users-management';
import MasterCodesManagement from '@/pages/master-codes-management';
import Analytics from '@/pages/analytics';

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

        {/* Protected routes */}
        <Route path="/" component={() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )} />
        <Route path="/dashboard" component={() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )} />
        <Route path="/rooms" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Rooms />
          </ProtectedRoute>
        )} />
        <Route path="/inquiries" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Inquiries />
          </ProtectedRoute>
        )} />
        <Route path="/bookings" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Bookings />
          </ProtectedRoute>
        )} />
        <Route path="/cleaning" component={() => (
          <ProtectedRoute>
            <Cleaning />
          </ProtectedRoute>
        )} />
        <Route path="/payments" component={() => (
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Payments />
          </ProtectedRoute>
        )} />
        <Route path="/reports" component={() => (
          <ProtectedRoute requiredRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        )} />
        <Route path="/users" component={() => (
          <ProtectedRoute requiredRoles={['admin']}>
              <UserManagement />
          </ProtectedRoute>
        )} />
         <Route path="/inventory" component={() => (
          <ProtectedRoute requiredRoles={['admin']}>
              <InventoryManagement />
          </ProtectedRoute>
        )} />
        <Route path="/user-management" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        )} />

        <Route path="/inventory-management" component={() => (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <InventoryManagement />
          </ProtectedRoute>
        )} />

        <Route path="/maintenance-management" component={() => (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <MaintenanceManagement />
          </ProtectedRoute>
        )} />

        <Route path="/banned-users-management" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <BannedUsersManagement />
          </ProtectedRoute>
        )} />

        <Route path="/master-codes-management" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <MasterCodesManagement />
          </ProtectedRoute>
        )} />

        <Route path="/analytics" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
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
      <TooltipProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;