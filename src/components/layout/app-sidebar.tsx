
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  BarChart3,
  CalendarDays,
  DollarSign,
  FileText,
  Home,
  Settings,
  Users,
  Building,
  MapPin,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  LineChart,
  Scroll,
  User,
} from "lucide-react";
import { toast } from "sonner";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Imóveis",
    url: "/properties",
    icon: Building,
  },
  {
    title: "Mapa de Imóveis",
    url: "/properties/map",
    icon: MapPin,
  },
  {
    title: "Contratos",
    url: "/contracts",
    icon: FileText,
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: CalendarDays,
  },
  {
    title: "Usuários",
    url: "/users",
    icon: Users,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Relatórios Avançados",
    url: "/advanced-reports",
    icon: TrendingUp,
  },
];

const financeItems = [
  {
    title: "Dashboard Financeiro",
    url: "/finances/dashboard",
    icon: LineChart,
  },
  {
    title: "Transações",
    url: "/finances/transactions",
    icon: DollarSign,
  },
  {
    title: "Relatórios",
    url: "/finances/reports",
    icon: Scroll,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      // Simple navigation to login - actual auth logic handled elsewhere
      navigate("/login");
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao realizar logout!");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0">
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[280px] pr-0" side="left">
        <SheetHeader className="pl-5 pb-4 pt-6">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navegue pelas funcionalidades do sistema.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <NavigationMenu>
          <NavigationMenuList className="flex flex-col gap-0.5 pl-2">
            {items.map((item) => (
              <NavigationMenuItem key={item.url}>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "h-11 rounded-md font-medium data-[active]:bg-secondary data-[state=open]:bg-secondary flex items-center justify-start gap-2 pl-4 text-sm",
                    (location.pathname === item.url || (item.url === "/agenda" && location.pathname.startsWith("/activities"))) && "bg-secondary"
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(item.url);
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            
            {/* Finance Section */}
            <div className="pt-2">
              <div className="text-xs font-medium text-muted-foreground px-4 pb-2">
                Financeiro
              </div>
              {financeItems.map((item) => (
                <NavigationMenuItem key={item.url}>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-11 rounded-md font-medium data-[active]:bg-secondary data-[state=open]:bg-secondary flex items-center justify-start gap-2 pl-4 text-sm",
                      location.pathname === item.url && "bg-secondary"
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(item.url);
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </div>
          </NavigationMenuList>
        </NavigationMenu>
        <Separator />
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
