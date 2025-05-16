
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

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
            <Button onClick={() => navigate("/")} className="mt-4">
              Voltar para a página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
