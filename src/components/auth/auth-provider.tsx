import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthUser, fetchUserProfile, fetchUserRole } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/utils/auth-cleanup';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  async function refreshUserData(session: Session) {
    if (!session?.user) return;

    try {
      const profile = await fetchUserProfile(session.user.id);
      const role = await fetchUserRole(session.user.id);
      
      console.log('User role fetched:', role);

      setUser({
        id: session.user.id,
        email: session.user.email,
        profile,
        role
      });

      // Pre-fetch some common permissions for better performance
      const commonPermissions = [
        'properties.view', 
        'properties.create', 
        'properties.edit',
        'contracts.view', 
        'contracts.create', 
        'users.view', 
        'users.invite',
        'users.manage', // Adicionado users.manage
        'settings.view', 
        'settings.edit',
        'clients.view',
        'admin_access', // Adicionado admin_access
      ];
      
      const permissionResults = {};
      for (const perm of commonPermissions) {
        const { data } = await supabase.rpc('user_has_permission', { 
          user_id: session.user.id,
          permission_name: perm
        });
        permissionResults[perm] = data || false;
        console.log(`Permission check for ${perm}:`, data);
      }
      
      setPermissions(permissionResults);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If we get an error fetching user data, the session might be invalid
      if (String(error).includes('401') || String(error).includes('Unauthorized')) {
        handleSessionError();
      }
    }
  }

  // Handle expired or invalid sessions
  function handleSessionError() {
    console.log('Handling session error, cleaning up auth state');
    cleanupAuthState();
    setUser(null);
    setSession(null);
    setPermissions({});
    
    // Redirect to login with a page reload to clear any React state
    window.location.href = '/login';
  }

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      setIsLoading(true);
      try {
        // Set up auth state listener FIRST to avoid missing auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth state changed:', event);
          
          if (mounted) {
            setSession(newSession);
          }
          
          if (event === 'SIGNED_IN' && newSession) {
            // Use setTimeout to avoid potential deadlocks with Supabase client
            setTimeout(() => {
              if (mounted) {
                refreshUserData(newSession);
              }
            }, 0);
          } else if (event === 'SIGNED_OUT') {
            if (mounted) {
              setUser(null);
              setPermissions({});
            }
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully');
          }
        });

        // THEN check for existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('Initial session check:', initialSession ? 'Session exists' : 'No session');
        
        if (mounted) {
          setSession(initialSession);
        
          if (initialSession) {
            await refreshUserData(initialSession);
          }
          
          setIsLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      // Limpar estado de autenticação anterior
      cleanupAuthState();
      
      // Tentar fazer logout global para garantir estado limpo
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar mesmo se falhar
        console.log('Error during global signout:', err);
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }
      
      // Forçar atualização da página para obter estado limpo
      window.location.href = '/dashboard';
      
    } catch (error) {
      toast.error('Ocorreu um erro durante o login');
      return Promise.reject(error);
    }
  }

  async function signUp(email: string, password: string, userData?: { first_name?: string; last_name?: string }) {
    try {
      // Limpar estado de autenticação anterior
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }

      toast.success('Verifique seu email para confirmar o cadastro');
    } catch (error) {
      toast.error('Ocorreu um erro durante o cadastro');
      return Promise.reject(error);
    }
  }

  async function signOut() {
    try {
      // Limpar estado de autenticação
      cleanupAuthState();
      
      // Tentar fazer logout global
      await supabase.auth.signOut({ scope: 'global' });
      
      toast.success('Você saiu com sucesso');
      
      // Forçar atualização da página para obter estado limpo
      window.location.href = '/login';
    } catch (error) {
      toast.error('Ocorreu um erro ao sair');
      // Ainda assim, tente redirecionar para login
      window.location.href = '/login';
      return Promise.reject(error);
    }
  }

  async function signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao entrar com Google');
      return Promise.reject(error);
    }
  }

  async function signInWithApple() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao entrar com Apple ID');
      return Promise.reject(error);
    }
  }

  async function updateProfile(data: Partial<typeof user.profile>) {
    if (!user) return Promise.reject(new Error('Usuário não autenticado'));

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        profile: {
          ...prev.profile,
          ...data
        }
      } : null);

      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      toast.error('Ocorreu um erro ao atualizar o perfil');
      return Promise.reject(error);
    }
  }

  function hasPermission(permission: string): boolean {
    console.log(`Checking permission ${permission} for user with role:`, user?.role);
    
    // If already cached, return immediately
    if (permissions[permission] !== undefined) {
      console.log(`Permission ${permission} cached result:`, permissions[permission]);
      return permissions[permission];
    }
    
    // Super admin bypass - now checks for 'admin' and 'system_admin' roles
    if (user?.role === 'admin' || user?.role === 'system_admin') {
      console.log(`User has admin/system_admin role, granting permission ${permission}`);
      setPermissions(prev => ({
        ...prev,
        [permission]: true
      }));
      return true;
    }
    
    // No admin so we need to fetch permission asynchronously
    if (user) {
      console.log(`Fetching permission ${permission} for user ${user.id}`);
      supabase.rpc('user_has_permission', { 
        user_id: user.id,
        permission_name: permission
      }).then(({ data, error }) => {
        if (error) {
          console.error(`Error checking permission ${permission}:`, error);
        } else {
          console.log(`Permission ${permission} RPC result:`, data);
          setPermissions(prev => ({
            ...prev,
            [permission]: data || false
          }));
        }
      });
    }
    
    // Since we couldn't determine immediately, default to false
    // This will be updated when the RPC call completes
    console.log(`Default deny for permission ${permission} (async check in progress)`);
    return false;
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      updateProfile,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}
