
import { useAuth } from "@/lib/auth";
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cleanupAuthState } from "@/utils/auth-cleanup";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, session, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  // Add logging for debugging permission checks
  useEffect(() => {
    if (requiredPermission && user) {
      console.log(`ProtectedRoute checking permission: ${requiredPermission} for user:`, {
        id: user.id,
        email: user.email,
        role: user.role
      });
    }
  }, [requiredPermission, user]);

  // Verificar se o token está expirado, mas só redirecionar se realmente estiver
  useEffect(() => {
    if (session) {
      const tokenExpiry = new Date(session.expires_at * 1000);
      const isExpired = tokenExpiry < new Date();
      
      if (isExpired) {
        console.log('Token expired in protected route, cleaning up auth state');
        cleanupAuthState();
        // Só redirecionar se o token estiver realmente expirado
        window.location.href = '/login';
      }
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-petroleum" />
      </div>
    );
  }

  if (!user || !session) {
    console.log('No user or session in protected route, redirecting to login');
    // Não limpar o estado de autenticação aqui para evitar problemas
    // Apenas redirecionar para login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required permission if specified
  if (requiredPermission) {
    const hasAccess = hasPermission(requiredPermission);
    console.log(`Permission check result for ${requiredPermission}:`, hasAccess);
    
    if (!hasAccess) {
      console.log(`Access denied for ${requiredPermission}, redirecting to unauthorized`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
