import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/protected-route";
import ErrorBoundary from "@/components/error-boundary";

// Import pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Rooms from "@/pages/rooms";
import Bookings from "@/pages/bookings";
import Payments from "@/pages/payments";
import Cleaning from "@/pages/cleaning";
import InventoryManagement from "@/pages/inventory-management";
import MaintenanceManagement from "@/pages/maintenance-management";
import BannedUsersManagement from "@/pages/banned-users-management";
import MasterCodesManagement from "@/pages/master-codes-management";
import UserManagement from "@/pages/user-management";
import Reports from "@/pages/reports";
import Analytics from "@/pages/analytics";
import Inquiries from "@/pages/inquiries";
import OperationsDashboard from "@/pages/operations-dashboard";
import Membership from "@/pages/membership";
import Tracker from "@/pages/tracker";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/membership" component={Membership} />
          <Route path="/track/:token" component={Tracker} />

          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/rooms">
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          </Route>

          <Route path="/bookings">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Bookings />
            </ProtectedRoute>
          </Route>

          <Route path="/payments">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Payments />
            </ProtectedRoute>
          </Route>

          <Route path="/cleaning">
            <ProtectedRoute>
              <Cleaning />
            </ProtectedRoute>
          </Route>

          <Route path="/inventory">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <InventoryManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/inventory-management">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <InventoryManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/maintenance">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MaintenanceManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/users">
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/banned-users">
            <ProtectedRoute allowedRoles={['admin']}>
              <BannedUsersManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/master-codes">
            <ProtectedRoute allowedRoles={['admin']}>
              <MasterCodesManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/reports">
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          </Route>

          <Route path="/inquiries">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Inquiries />
            </ProtectedRoute>
          </Route>

          <Route path="/analytics">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Analytics />
            </ProtectedRoute>
          </Route>

          <Route path="/operations">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route component={NotFound} />
        </Switch>
      </div>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}