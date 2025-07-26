import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/navigation';
import ProtectedRoute from '@/components/protected-route';
import { Route, Switch } from 'wouter';

// Import all pages
import Dashboard from '@/pages/dashboard';
import UserManagement from '@/pages/user-management';
import Cleaning from '@/pages/cleaning';
import OperationsDashboard from '@/pages/operations-dashboard';
import Inquiries from '@/pages/inquiries';
import Bookings from '@/pages/bookings';
import Payments from '@/pages/payments';
import Rooms from '@/pages/rooms';
import Reports from '@/pages/reports';
import Analytics from '@/pages/analytics';
import MaintenanceManagement from '@/pages/maintenance-management';
import InventoryManagement from '@/pages/inventory-management';
import BannedUsersManagement from '@/pages/banned-users-management';
import MasterCodesManagement from '@/pages/master-codes-management';
import Membership from '@/pages/membership';
import Tracker from '@/pages/tracker';
import NotFound from '@/pages/not-found';
import Login from '@/pages/login';
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppRouter() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/membership" component={Membership} />
        <Route path="/tracker/:token" component={Tracker} />
        <Route path="/dashboard">
          <Navigation>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/operations">
          <Navigation>
            <ProtectedRoute>
              <OperationsDashboard />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/rooms">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager']}>
              <Rooms />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/bookings">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager']}>
              <Bookings />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/cleaning">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager', 'helper']}>
              <Cleaning />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/payments">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager']}>
              <Payments />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/reports">
          <Navigation>
            <ProtectedRoute roles={['admin']}>
              <Reports />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/analytics">
          <Navigation>
            <ProtectedRoute roles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/inquiries">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager']}>
              <Inquiries />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/users">
          <Navigation>
            <ProtectedRoute roles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/maintenance-management">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager']}>
              <MaintenanceManagement />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/inventory-management">
          <Navigation>
            <ProtectedRoute roles={['admin', 'manager']}>
              <InventoryManagement />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/banned-users">
          <Navigation>
            <ProtectedRoute roles={['admin']}>
              <BannedUsersManagement />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route path="/master-codes">
          <Navigation>
            <ProtectedRoute roles={['admin']}>
              <MasterCodesManagement />
            </ProtectedRoute>
          </Navigation>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <AppRouter />
          <Toaster />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}