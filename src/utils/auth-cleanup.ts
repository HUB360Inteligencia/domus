
/**
 * Limpa completamente o estado de autenticação do Supabase no navegador
 * Útil quando há problemas de tokens expirados ou sessão corrompida
 */
export const cleanupAuthState = () => {
  // Remove tokens padrão de autenticação
  localStorage.removeItem('supabase.auth.token');
  
  // Remove todas as chaves relacionadas ao Supabase do localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove do sessionStorage se estiver em uso
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};
