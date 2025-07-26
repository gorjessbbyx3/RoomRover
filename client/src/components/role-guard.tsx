
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
