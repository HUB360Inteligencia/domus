const RECOVERY_FLAG = "domus:password-recovery";

/**
 * O link de "esqueci minha senha" chega com `type=recovery` no hash/query.
 * O cliente do Supabase consome esse hash ao iniciar, então a marcação precisa
 * acontecer antes de criá-lo (ver integrations/supabase/client.ts).
 */
export function detectPasswordRecoveryFromUrl() {
  if (typeof window === "undefined") return;
  const { hash, search } = window.location;
  if (/(^|[#&?])type=recovery(&|$)/.test(hash) || /(^|[#&?])type=recovery(&|$)/.test(search)) {
    markPasswordRecovery();
  }
}

export function markPasswordRecovery() {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, "1");
  } catch {
    /* storage indisponível: o evento PASSWORD_RECOVERY ainda redireciona */
  }
}

export function isPasswordRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearPasswordRecovery() {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {
    /* ignore */
  }
}

export const UPDATE_PASSWORD_PATH = "/auth/update-password";
