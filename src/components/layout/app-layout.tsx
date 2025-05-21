
import { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="patrimonio-theme">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 lg:ml-64">
            <AppHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
            <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Sistema de Gestão Patrimonial. Todos os direitos reservados.
            </footer>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
