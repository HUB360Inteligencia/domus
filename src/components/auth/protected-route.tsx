
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredPermission, requiredRole }: ProtectedRouteProps) {
  const { user, session, isLoading, hasPermission } = useAuth();

  if (isLoading || (session && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check explicit role requirement (e.g., system_admin for master panel)
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
