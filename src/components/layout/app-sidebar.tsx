
import { 
  Building, 
  FileText, 
  LayoutDashboard, 
  Users, 
  MessageSquare,
  Settings,
  CheckSquare,
  Home,
  FileBox,
  Wallet,
  User,
  LineChart,
  ArrowUpCircle,
  ArrowDownCircle,
  Scroll
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      to: "/dashboard",
      Icon: Home,
    },
    {
      name: "Imóveis",
      to: "/properties",
      Icon: Building,
    },
    {
      name: "Contratos",
      to: "/contracts",
      Icon: FileText,
    },
    {
      name: "Atividades",
      to: "/activities",
      Icon: CheckSquare,
    },
    {
      name: "Documentos",
      to: "/documents",
      Icon: FileBox,
    },
    {
      name: "Usuários",
      to: "/users",
      Icon: User,
    },
  ];

  const financeSubMenu = [
    {
      name: "Painel",
      to: "/finances/dashboard",
      Icon: LineChart,
    },
    {
      name: "Receitas",
      to: "/finances/income",
      Icon: ArrowUpCircle,
    },
    {
      name: "Despesas",
      to: "/finances/expenses",
      Icon: ArrowDownCircle,
    },
    {
      name: "Relatórios",
      to: "/finances/reports",
      Icon: Scroll,
    }
  ];

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
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link to={item.to}>
                  <item.Icon className="h-5 w-5 mr-2" />
                  {item.name}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Wallet className="h-5 w-5 mr-2" />
              Finanças
            </SidebarMenuButton>
            <SidebarMenuSub>
              {financeSubMenu.map((item) => (
                <SidebarMenuSubItem key={item.name}>
                  <SidebarMenuSubButton asChild>
                    <Link to={item.to}>
                      <item.Icon className="h-4 w-4 mr-2" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
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
            <AvatarImage src="" alt="Perfil" />
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
