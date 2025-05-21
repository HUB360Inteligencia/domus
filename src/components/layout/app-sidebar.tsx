
import { 
  Building, 
  FileText, 
  LayoutDashboard, 
  Users, 
  Upload,
  MessageSquare,
  Receipt,
  Settings,
  Home
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center gap-2 p-4">
        <Building className="h-8 w-8 text-petroleum" />
        <div className="flex flex-col">
          <span className="font-bold">Gestão Patrimonial</span>
          <span className="text-xs text-muted-foreground">
            Versão 1.0
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/properties">
                <Building className="h-5 w-5 mr-2" />
                Imóveis
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/contracts">
                <FileText className="h-5 w-5 mr-2" />
                Contratos
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/documents">
                <Upload className="h-5 w-5 mr-2" />
                Documentos
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/finances">
                <Receipt className="h-5 w-5 mr-2" />
                Finanças
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/users">
                <Users className="h-5 w-5 mr-2" />
                Usuários
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarGroup>
          <SidebarGroupLabel>Inteligência artificial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/ai-assistant">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Assistente IA
                    <Badge className="ml-auto" variant="secondary">Novo</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/settings">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurações
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-petroleum text-white">AP</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Admin Principal</p>
            <p className="text-xs text-muted-foreground">admin@exemplo.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
