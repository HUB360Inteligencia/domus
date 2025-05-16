
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
  SidebarSection,
  SidebarSectionTitle,
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
          <SidebarMenuItem href="/">
            <SidebarMenuButton>
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem href="/properties">
            <SidebarMenuButton>
              <Building className="h-5 w-5 mr-2" />
              Imóveis
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem href="/contracts">
            <SidebarMenuButton>
              <FileText className="h-5 w-5 mr-2" />
              Contratos
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem href="/documents">
            <SidebarMenuButton>
              <Upload className="h-5 w-5 mr-2" />
              Documentos
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem href="/finances">
            <SidebarMenuButton>
              <Receipt className="h-5 w-5 mr-2" />
              Finanças
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem href="/users">
            <SidebarMenuButton>
              <Users className="h-5 w-5 mr-2" />
              Usuários
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarSection>
          <SidebarSectionTitle>Inteligência artificial</SidebarSectionTitle>
          <SidebarMenu>
            <SidebarMenuItem href="/ai-assistant">
              <SidebarMenuButton>
                <MessageSquare className="h-5 w-5 mr-2" />
                Assistente IA
                <Badge className="ml-auto" variant="secondary">Novo</Badge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarSection>
        
        <SidebarSection>
          <SidebarSectionTitle>Sistema</SidebarSectionTitle>
          <SidebarMenu>
            <SidebarMenuItem href="/settings">
              <SidebarMenuButton>
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarSection>
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
