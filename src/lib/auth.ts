import { createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Enums']['app_role'];

export interface AuthUser {
  id: string;
  email?: string;
  profile?: Profile | null;
  role?: UserRole | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: { first_name?: string; last_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

// Provide a default context value to prevent "undefined" errors
const defaultContextValue: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signIn: () => Promise.reject(new Error('AuthProvider not initialized')),
  signUp: () => Promise.reject(new Error('AuthProvider not initialized')),
  signOut: () => Promise.reject(new Error('AuthProvider not initialized')),
  signInWithGoogle: () => Promise.reject(new Error('AuthProvider not initialized')),
  signInWithApple: () => Promise.reject(new Error('AuthProvider not initialized')),
  updateProfile: () => Promise.reject(new Error('AuthProvider not initialized')),
  hasPermission: () => false,
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function fetchUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .rpc('get_user_role', { user_id: userId });

  if (error) {
    logger.error('Error fetching user role:', error);
    return null;
  }

  return data as UserRole;
}

export async function fetchCurrentUserRole(): Promise<UserRole | null> {
  const { data, error } = await supabase.rpc('current_user_role');

  if (error) {
    logger.error('Error fetching current user role:', error);
    return null;
  }

  return data as UserRole;
}

export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('user_has_permission', {
      user_id: userId,
      permission_name: permission
    });

  if (error) {
    logger.error('Error checking permission:', error);
    return false;
  }

  return data || false;
}
