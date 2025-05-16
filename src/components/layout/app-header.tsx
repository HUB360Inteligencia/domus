
import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const getInitials = () => {
    if (!user || !user.profile) return "?";
    
    const firstName = user.profile.first_name || "";
    const lastName = user.profile.last_name || "";
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      
      {!isMobile && (
        <div className="w-full max-w-sm">
          <form className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full pl-8 bg-background"
            />
          </form>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-auto">
              <DropdownMenuGroup>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                  <div className="font-medium">Vencimento de contrato</div>
                  <div className="text-sm text-muted-foreground">
                    O contrato do imóvel Apartamento Central vence em 7 dias
                  </div>
                  <div className="text-xs text-muted-foreground">há 1 hora</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-4">
                  <div className="font-medium">Pagamento recebido</div>
                  <div className="text-sm text-muted-foreground">
                    Recebimento do aluguel do imóvel Casa de Praia confirmado
                  </div>
                  <div className="text-xs text-muted-foreground">há 3 horas</div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-center">
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 ml-1"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile?.avatar_url || ""} alt="Avatar" />
                <AvatarFallback className="bg-petroleum">{getInitials()}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.profile?.first_name} {user?.profile?.last_name}
              <div className="text-xs font-normal text-muted-foreground">
                {user?.email}
              </div>
              {user?.role && (
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize">
                    {user.role === 'admin' ? 'Administrador' :
                     user.role === 'manager' ? 'Gestor' :
                     user.role === 'user' ? 'Usuário' : 'Visualizador'}
                  </span>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut().then(() => navigate("/login"))}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
