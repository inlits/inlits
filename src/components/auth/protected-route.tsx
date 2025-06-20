import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  requireEmailVerification?: boolean;
}

export function ProtectedRoute({ 
  children, 
  roles, 
  requireEmailVerification = true 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Log access attempts to protected routes
  useEffect(() => {
    if (!loading && !user) {
      logSecurityEvent('unauthorized_access_attempt', {
        path: location.pathname,
        referrer: document.referrer
      });
    } else if (!loading && user && roles && (!profile || !roles.includes(profile.role))) {
      logSecurityEvent('insufficient_permissions', {
        path: location.pathname,
        userRole: profile?.role,
        requiredRoles: roles
      }, user.id);
    }
  }, [loading, user, profile, roles, location.pathname]);

  // Show nothing while checking auth status
  if (loading) {
    return null;
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (roles && (!profile || !roles.includes(profile.role))) {
    // Log access denied
    logSecurityEvent('access_denied', {
      path: location.pathname,
      userRole: profile?.role,
      requiredRoles: roles
    }, user.id);
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}