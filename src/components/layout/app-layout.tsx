
import { ReactNode } from "react";
import { AppSidebar } from "./animated-sidebar";
import { AppHeader } from "./app-header";
import { ThemeProvider } from "@/components/theme-provider";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="patrimonio-theme">
      <div className="flex min-h-screen w-full bg-background">
        {/* Single responsive sidebar */}
        <AppSidebar />
        
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 p-3 md:p-6">
            {children}
          </main>
          <footer className="border-t py-2 md:py-4 px-3 md:px-6 text-center text-xs md:text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sistema de Gestão Patrimonial. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}
