
import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthUser, fetchUserProfile, fetchUserRole } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

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

    const profile = await fetchUserProfile(session.user.id);
    const role = await fetchUserRole(session.user.id);

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
      'settings.view', 
      'settings.edit'
    ];
    
    const permissionResults = {};
    for (const perm of commonPermissions) {
      const { data } = await supabase.rpc('user_has_permission', { 
        user_id: session.user.id,
        permission_name: perm
      });
      permissionResults[perm] = data || false;
    }
    
    setPermissions(permissionResults);
  }

  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          await refreshUserData(session);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession) {
        await refreshUserData(newSession);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPermissions({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return Promise.reject(error);
      }
    } catch (error) {
      toast.error('Ocorreu um erro durante o login');
      return Promise.reject(error);
    }
  }

  async function signUp(email: string, password: string, userData?: { first_name?: string; last_name?: string }) {
    try {
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
      await supabase.auth.signOut();
      toast.success('Você saiu com sucesso');
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

  function hasPermission(permission: string): boolean {
    // If already cached, return immediately
    if (permissions[permission] !== undefined) {
      return permissions[permission];
    }
    
    // Super admin bypass
    if (user?.role === 'admin') {
      return true;
    }
    
    // No admin so we need to fetch permission asynchronously
    if (user) {
      supabase.rpc('user_has_permission', { 
        user_id: user.id,
        permission_name: permission
      }).then(({ data }) => {
        setPermissions(prev => ({
          ...prev,
          [permission]: data || false
        }));
      });
    }
    
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
