
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface UseRoleGuardOptions {
  allowedRoles: string[];
  redirectTo?: string;
  showUnauthorized?: boolean;
}

export function useRoleGuard({ 
  allowedRoles, 
  redirectTo = '/unauthorized', 
  showUnauthorized = true 
}: UseRoleGuardOptions) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isLoading && !hasAccess && !showUnauthorized) {
      setLocation(redirectTo);
    }
  }, [isLoading, hasAccess, showUnauthorized, redirectTo, setLocation]);

  return {
    hasAccess: Boolean(hasAccess),
    isLoading,
    user,
    canAccess: (roles: string[]) => user && roles.includes(user.role)
  };
}

export function withRoleGuard<T extends object>(
  Component: React.ComponentType<T>,
  allowedRoles: string[],
  options?: Omit<UseRoleGuardOptions, 'allowedRoles'>
) {
  return function GuardedComponent(props: T) {
    const { hasAccess, isLoading } = useRoleGuard({ 
      allowedRoles, 
      ...options 
    });

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!hasAccess) {
      return <div>Access Denied</div>;
    }

    return <Component {...props} />;
  };
}
