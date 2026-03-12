
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, session, isLoading } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (!isLoading && session && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, redirect to login
  if (!isLoading && !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
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
