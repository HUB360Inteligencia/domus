
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database["public"]["Enums"]["app_role"];

export interface AuthUser extends User {
  role?: AppRole | string;
  profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  hasPermission: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Sistema básico de permissões baseado em roles
const rolePermissions: Record<string, string[]> = {
  admin: [
    'admin.view',
    'users.invite',
    'users.edit',
    'users.delete',
    'users.manage_roles',
    'clients.view',
    'clients.create',
    'clients.edit',
    'clients.delete'
  ],
  moderator: [
    'users.invite',
    'users.edit',
    'clients.view',
    'clients.edit'
  ],
  user: [
    'properties.view',
    'properties.create',
    'properties.edit'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    const userRole = user.role.toString();
    return rolePermissions[userRole]?.includes(permission) || false;
  };

  const fetchUserWithProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Erro ao buscar perfil:", profileError);
      }

      // Buscar role do usuário
      const { data: role } = await supabase.rpc("get_user_role", {
        user_id: userId
      });

      // Buscar dados básicos do usuário
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) return null;

      return {
        ...authUser,
        role,
        profile: profile || {
          id: userId,
          email: authUser.email
        }
      };
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Defer user profile fetching to prevent deadlocks
          setTimeout(async () => {
            const userWithProfile = await fetchUserWithProfile(session.user.id);
            setUser(userWithProfile);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const userWithProfile = await fetchUserWithProfile(session.user.id);
        setUser(userWithProfile);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    isLoading,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
