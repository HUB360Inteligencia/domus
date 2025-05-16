
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-9xl font-bold text-petroleum">404</h1>
      <h2 className="text-3xl font-bold mt-4">Página não encontrada</h2>
      <p className="mt-4 text-muted-foreground max-w-md">
        A página que você está procurando não existe ou foi removida.
      </p>
      <Button asChild className="mt-8 bg-petroleum hover:bg-petroleum-600">
        <Link to="/">Voltar para o Dashboard</Link>
      </Button>
    </div>
  );
}
