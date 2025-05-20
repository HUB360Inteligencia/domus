
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

  // Verificar se o token está expirado
  useEffect(() => {
    if (session) {
      const tokenExpiry = new Date(session.expires_at * 1000);
      const isExpired = tokenExpiry < new Date();
      
      if (isExpired) {
        console.log('Token expired in protected route, cleaning up auth state');
        cleanupAuthState();
        // Forçar atualização da página ao invés de usar Navigate
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
    // Limpar estado de autenticação antes de redirecionar
    cleanupAuthState();
    // Redirect to login but save the current location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for required permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
