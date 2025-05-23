
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if user is authenticated and has a valid session
 */
export const checkAuthStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, session: null, error };
    }

    return {
      isAuthenticated: !!session,
      session,
      error: null
    };
  } catch (err) {
    console.error('Failed to check auth status:', err);
    return { isAuthenticated: false, session: null, error: err };
  }
};

/**
 * Handle authentication errors consistently
 */
export const handleAuthError = (error: any) => {
  if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
    return {
      message: 'Sessão expirada. Por favor, faça login novamente.',
      shouldRedirect: true
    };
  }
  
  if (error?.code === 'PGRST116') {
    return {
      message: 'Nenhum dado encontrado.',
      shouldRedirect: false
    };
  }

  return {
    message: error?.message || 'Erro desconhecido',
    shouldRedirect: false
  };
};
