
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./animated-sidebar";
import { AppHeader } from "./app-header";
import { ThemeProvider } from "@/components/theme-provider";

export function AppLayout() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="patrimonio-theme">
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        {/* Mobile sidebar - shown only on mobile */}
        <div className="md:hidden">
          <AppSidebar />
        </div>
        
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 p-3 md:p-6">
            <Outlet />
          </main>
          <footer className="border-t py-2 md:py-4 px-3 md:px-6 text-center text-xs md:text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sistema de Gestão Patrimonial. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}
