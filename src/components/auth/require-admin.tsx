
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/auth-provider';

interface RequireAdminProps {
  children: React.ReactNode;
}

export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
