import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}