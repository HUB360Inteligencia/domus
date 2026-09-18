import { ArrowLeft, Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="premium-panel dark:premium-panel-dark w-full max-w-lg rounded-[2.5rem] p-8 text-center md:p-10">
        <div className="premium-gradient mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl shadow-[0_20px_45px_-24px_rgba(80,52,31,0.85)]">
          <img src="/brand/domus-symbol-white.svg" alt="" className="h-9 w-9" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Erro 404</p>
        <h1 className="mt-2 text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          O endereço <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{location.pathname}</code> não existe
          ou foi movido.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {canGoBack && (
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <Button asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Ir para o Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
