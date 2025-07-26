
import React from 'react';
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ShieldX } from 'lucide-react';

interface RoleRouteGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleRouteGuard({ allowedRoles, children, fallback }: RoleRouteGuardProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <Alert className="m-4">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to access this page.
          <Button 
            variant="link" 
            className="p-0 ml-2 h-auto"
            onClick={() => setLocation('/login')}
          >
            Login here
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="m-4" variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this page. Required role: {allowedRoles.join(' or ')}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
