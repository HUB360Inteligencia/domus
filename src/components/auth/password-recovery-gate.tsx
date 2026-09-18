import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { isPasswordRecoveryPending, UPDATE_PASSWORD_PATH } from "@/lib/password-recovery";

/**
 * Quem abre o link de "esqueci minha senha" entra com uma sessão de recuperação.
 * Sem este desvio o usuário caía no Dashboard sem nunca definir a nova senha.
 */
export function PasswordRecoveryGate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectIfNeeded = () => {
      if (isPasswordRecoveryPending() && location.pathname !== UPDATE_PASSWORD_PATH) {
        navigate(UPDATE_PASSWORD_PATH, { replace: true });
      }
    };

    redirectIfNeeded();
    window.addEventListener("domus:password-recovery", redirectIfNeeded);
    return () => window.removeEventListener("domus:password-recovery", redirectIfNeeded);
  }, [location.pathname, navigate]);

  return null;
}
