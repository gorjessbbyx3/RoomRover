
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard',
  fallback 
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
      });
      navigate(redirectTo);
    }
  }, [user, isLoading, allowedRoles, redirectTo, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component version
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[],
  options?: {
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard 
        allowedRoles={allowedRoles}
        redirectTo={options?.redirectTo}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}
import { useAuth } from '@/lib/auth';
import { useRouter } from 'wouter';
import { useEffect } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallbackPath = '/dashboard',
  showUnauthorized = true 
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !allowedRoles.includes(user.role))) {
      if (!showUnauthorized) {
        setLocation(fallbackPath);
      }
    }
  }, [user, isLoading, allowedRoles, fallbackPath, showUnauthorized, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You must be logged in to access this page.
            </p>
            <Button onClick={() => setLocation('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    if (!showUnauthorized) {
      return null;
    }

    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required role: {allowedRoles.join(' or ')}
              <br />
              Your role: {user.role}
            </p>
            <Button onClick={() => setLocation(fallbackPath)} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function withRoleGuard<T extends object>(
  Component: React.ComponentType<T>,
  allowedRoles: string[],
  options?: {
    fallbackPath?: string;
    showUnauthorized?: boolean;
  }
) {
  return function GuardedComponent(props: T) {
    return (
      <RoleGuard allowedRoles={allowedRoles} {...options}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
