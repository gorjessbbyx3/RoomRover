import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/protected-route";
import ErrorBoundary from "@/components/error-boundary";

// Import pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import InHouse from './pages/inhouse';
import Payments from "@/pages/payments";
//import Cleaning from "@/pages/cleaning"; // Cleaning page removed
import BannedUsersManagement from "@/pages/banned-users-management";
import MasterCodesManagement from "@/pages/master-codes-management";
import UserManagement from "@/pages/user-management";
import FinancialManagement from '@/pages/financial-management';
import Reports from "@/pages/reports";
import Analytics from "@/pages/analytics";
import Inquiries from "@/pages/inquiries";
import OperationsDashboard from "@/pages/operations-dashboard";
import Membership from "@/pages/membership";
import Tracker from "@/pages/tracker";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <AuthProvider>
      <Navigation>
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

          <Route path="/inhouse">
            <ProtectedRoute>
              <InHouse />
            </ProtectedRoute>
          </Route>

          <Route path="/payments">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Payments />
            </ProtectedRoute>
          </Route>

          <Route path="/cleaning">
            <ProtectedRoute allowedRoles={['admin', 'manager', 'helper']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/inventory">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/inventory-management">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>

          <Route path="/manager-dashboard">
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/helper-dashboard">
            <ProtectedRoute allowedRoles={['helper']}>
              <HelperDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/maintenance">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/maintenance-management">
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/operations">
            <ProtectedRoute allowedRoles={['admin', 'manager', 'helper']}>
              <OperationsDashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/users">
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/user-management">
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/banned-users">
            <ProtectedRoute allowedRoles={['admin']}>
              <BannedUsersManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/banned-users-management">
            <ProtectedRoute allowedRoles={['admin']}>
              <BannedUsersManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/master-codes">
            <ProtectedRoute allowedRoles={['admin']}>
              <MasterCodesManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/master-codes-management">
            <ProtectedRoute allowedRoles={['admin']}>
              <MasterCodesManagement />
            </ProtectedRoute>
          </Route>

          <Route path="/reports">
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          </Route>
          
	 <Route path="/financial-management">
            <ProtectedRoute allowedRoles={['admin']}>
              <FinancialManagement />
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
      </Navigation>
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