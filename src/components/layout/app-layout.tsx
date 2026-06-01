
import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./animated-sidebar";
import { AppHeader } from "./app-header";
import { ThemeProvider } from "@/components/theme-provider";
import { ForcePasswordChange } from "@/components/auth/force-password-change";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { session } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    // Check if the current user has the must_change_password flag set in their metadata
    if (session?.user?.user_metadata?.must_change_password) {
      setMustChangePassword(true);
    }
  }, [session]);

  function handlePasswordChanged() {
    setMustChangePassword(false);
    // Refresh the session to update user_metadata
    supabase.auth.refreshSession();
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="patrimonio-theme">
      <div className="flex min-h-screen w-full bg-background premium-grid-lines">
        {/* Single responsive sidebar */}
        <AppSidebar />
        
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 px-3 py-4 md:px-6 lg:px-8">
            {children}
          </main>
          <footer className="mx-3 mb-3 rounded-3xl border border-white/60 bg-white/55 px-3 py-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur md:mx-6 md:mb-6 md:px-6 dark:border-white/10 dark:bg-white/5">
            &copy; {new Date().getFullYear()} Sistema de Gestão Patrimonial. Todos os direitos reservados.
          </footer>
        </div>
      </div>

      {/* Force password change modal */}
      <ForcePasswordChange 
        open={mustChangePassword} 
        onPasswordChanged={handlePasswordChanged} 
      />
    </ThemeProvider>
  );
}
