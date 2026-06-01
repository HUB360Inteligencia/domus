
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthUser, fetchCurrentUserRole, fetchUserProfile, fetchUserRole } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { cleanupAuthState } from '@/utils/auth-cleanup';
import { logger } from '@/lib/logger';

const isDev = import.meta.env.DEV;

function devLog(...args: unknown[]) {
  if (isDev) console.log(...args);
}

interface AuthProviderProps {
  children: ReactNode;
}

// All common permissions are pre-fetched during login so hasPermission is always synchronous
const COMMON_PERMISSIONS = [
  'properties.view',
  'properties.create',
  'properties.edit',
  'contracts.view',
  'contracts.create',
  'users.view',
  'users.invite',
  'settings.view',
  'settings.edit',
  'clients.view',
  'manage_users',
  'admin_access',
  'contacts.view',
  'contacts.create',
  'contacts.edit',
  'contacts.delete',
  'contacts.links.manage',
  'contacts.interactions.view',
  'contacts.interactions.manage',
  'contacts.financial.view',
  'contacts.documents.view',
];

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const prefetchPermissions = useCallback(async (userId: string): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};

    // Run all permission checks in parallel for speed
    const checks = await Promise.allSettled(
      COMMON_PERMISSIONS.map(async (perm) => {
        const { data } = await supabase.rpc('user_has_permission', {
          user_id: userId,
          permission_name: perm,
        });
        return { perm, value: data || false };
      })
    );

    for (const result of checks) {
      if (result.status === 'fulfilled') {
        results[result.value.perm] = result.value.value;
      }
    }

    devLog('Permissions pre-fetched:', results);
    return results;
  }, []);

  const refreshUserData = useCallback(async (currentSession: Session) => {
    if (!currentSession?.user) return;

    try {
      const [profile, currentRole] = await Promise.all([
        fetchUserProfile(currentSession.user.id),
        fetchCurrentUserRole(),
      ]);

      let finalRole = currentRole || (await fetchUserRole(currentSession.user.id));

      // If they are just a 'user' at system level, check if they are an admin/manager in their organization
      if (finalRole === 'user' || !finalRole) {
        const { data: clientUser } = await supabase
          .from('client_users')
          .select('role')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();

        if (clientUser && clientUser.role) {
          finalRole = clientUser.role as UserRole;
        }
      }

      devLog('User role fetched:', finalRole);

      setUser({
        id: currentSession.user.id,
        email: currentSession.user.email,
        profile,
        role: finalRole,
      });

      const perms = await prefetchPermissions(currentSession.user.id);
      setPermissions(perms);
    } catch (error) {
      logger.error('Error refreshing user data:', error);
      if (String(error).includes('401') || String(error).includes('Unauthorized')) {
        handleSessionError();
      }
    }
  }, [prefetchPermissions]);

  // Handle expired or invalid sessions
  function handleSessionError() {
    devLog('Handling session error, cleaning up auth state');
    cleanupAuthState();
    setUser(null);
    setSession(null);
    setPermissions({});
  }

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      setIsLoading(true);
      try {
        // Set up auth state listener FIRST to avoid missing auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          devLog('Auth state changed:', event);

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
            devLog('Token refreshed successfully');
          }
        });

        // THEN check for existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        devLog('Initial session check:', initialSession ? 'Session exists' : 'No session');

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
        logger.error('Error getting initial session:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    return () => {
      mounted = false;
    };
  }, [refreshUserData]);

  async function signIn(email: string, password: string) {
    try {
      // Limpar estado de autenticação anterior
      cleanupAuthState();

      // Tentar fazer logout global para garantir estado limpo
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar mesmo se falhar
        devLog('Error during global signout:', err);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }

      // The onAuthStateChange listener will handle session setup and navigation
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

      // The onAuthStateChange listener will clear the state
    } catch (error) {
      toast.error('Ocorreu um erro ao sair');
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

  /**
   * Purely synchronous permission check — uses only the pre-fetched cache.
   * system_admin bypasses ALL checks.
   * admin bypasses org-level checks but NOT system-level (admin_access).
   */
  function hasPermission(permission: string): boolean {
    // System owner — full bypass
    if (user?.role === 'system_admin') {
      return true;
    }

    // Org-level admin — bypass everything EXCEPT system-level permissions
    if (user?.role === 'admin') {
      if (permission === 'admin_access') {
        return false;
      }
      return true;
    }

    // Return cached value; if not cached, deny by default.
    // All common permissions are pre-fetched during login.
    return permissions[permission] ?? false;
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
