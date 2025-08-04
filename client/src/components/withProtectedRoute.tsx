import React from 'react';
import { useUser } from '../hooks/useUser';
import { Navigate } from 'react-router-dom';

/**
 * HOC to protect routes based on authentication, role, and optional custom permission logic.
 * @param {React.ComponentType} Component - The component to render if access is allowed.
 * @param {Object} options - Options for protection.
 * @param {string[]} [options.allowedRoles] - Array of allowed roles (e.g., ['admin', 'manager']).
 * @param {(user: any) => boolean} [options.check] - Optional custom permission function.
 */
export function withProtectedRoute(Component, options = {}) {
  const { allowedRoles = [], check } = options;
  return function ProtectedRouteWrapper(props) {
    const { user, loading, error } = useUser();

    if (loading) return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></span>
        Loading...
      </div>
    );
    if (error) return <div className="text-red-600 text-center mt-8">Error: {error.message || 'Failed to load user'}</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (typeof check === 'function' && !check(user)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <Component {...props} user={user} />;
  };
}

/**
 * Usage examples:
 * // Role-based only:
 * const AdminDashboard = withProtectedRoute(Dashboard, { allowedRoles: ['admin'] });
 * <Route path="/admin" element={<AdminDashboard />} />;
 *
 * // With custom permission logic:
 * const OnlySelfProfile = withProtectedRoute(Profile, { check: (user) => user.id === getProfileIdFromRoute() });
 */
