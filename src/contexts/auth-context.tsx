
import { createContext } from 'react';
import { AuthContextType } from '@/lib/auth';
import { AuthProvider as AuthProviderComponent } from '@/components/auth/auth-provider';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
}
