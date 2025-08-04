import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth";
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
import Profile from "@/pages/profile";
import ManagerDashboard from "@/pages/manager-dashboard";
import HelperDashboard from "@/pages/helper-dashboard";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Don't show navigation on login, membership, or tracker pages
  const showNavigation = isAuthenticated() && 
    !location.startsWith('/login') && 
    !location.startsWith('/membership') && 
    !location.startsWith('/track');

  return (
    <>
      {showNavigation && <Navigation />}
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/membership" component={Membership} />
        <Route path="/track/:token" component={Tracker} />
        <Route path="/track/success" component={() => (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Inquiry Submitted Successfully!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your interest in our properties. We've received your membership inquiry and will review it shortly.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can track the status of your inquiry using the tracker link we provided.
              </p>
              <a 
                href="/membership" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Home
              </a>
            </div>
          </div>
        )} />

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

        <Route path="/operations">
          <ProtectedRoute allowedRoles={['admin', 'manager', 'helper']}>
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

        <Route path="/user-management">
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        </Route>

        <Route path="/banned-users-management">
          <ProtectedRoute allowedRoles={['admin']}>
            <BannedUsersManagement />
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
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </>
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