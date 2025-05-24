
import { ReactNode } from "react";
import { AppSidebar } from "./animated-sidebar";
import { AppHeader } from "./app-header";
import { ThemeProvider } from "@/components/theme-provider";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="patrimonio-theme">
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
          <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sistema de Gestão Patrimonial - Admin. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}
