import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * "Voltar" que respeita a navegação do usuário: volta para a tela anterior
 * dentro do app (ex.: do contrato para o imóvel de onde ele foi aberto) e só usa
 * o `fallback` quando a página foi aberta direto (link externo, nova aba, F5).
 */
export function useBackNavigation(fallback: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [fallback, navigate]);
}
