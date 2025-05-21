
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface RequireAdminProps {
  children: React.ReactNode;
}

export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, isLoading, hasPermission } = useAuth();
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  // Check if user has admin role
  const isAdmin = user.role === 'admin' || user.role === 'system_admin';
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
