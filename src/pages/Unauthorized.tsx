
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
            <div className="text-sm text-gray-500 mt-2">
              {user && (
                <div className="text-left">
                  <p>Informações de depuração:</p>
                  <p>Usuário: {user.email}</p>
                  <p>Função: {user.role || 'Nenhuma função definida'}</p>
                  <p>ID: {user.id}</p>
                </div>
              )}
            </div>
            <Button onClick={() => navigate("/")} className="mt-4">
              Voltar para a página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
