
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, session, isLoading } = useAuth();
  
  // If user is authenticated, redirect to dashboard instead of showing unauthorized
  if (!isLoading && session && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, redirect to login
  if (!isLoading && !session) {
    return <Navigate to="/login" replace />;
  }

  // Add debug information for troubleshooting
  useEffect(() => {
    if (user) {
      console.log("Unauthorized page - Current user info:", {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log("Unauthorized page - No user found");
    }
  }, [user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página ou recurso.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Ir para o Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
