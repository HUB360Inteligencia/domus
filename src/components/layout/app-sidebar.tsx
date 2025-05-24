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
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Home,
  Settings,
  Users,
  Building,
  MapPin,
  TrendingUp,
} from "lucide-react";

const items = [
  {
    title: "Dashboard",
    url: "/",
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
    title: "Financeiro",
    url: "/finances/dashboard",
    icon: DollarSign,
  },
  {
    title: "Relatórios",
    url: "/finances/reports",
    icon: BarChart3,
  },
  {
    title: "Agendamentos",
    url: "/schedules",
    icon: Calendar,
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

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você será redirecionado para a página de login.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao realizar logout!",
        description: error.message,
      });
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
                    "h-11 rounded-md font-medium data-[active]:bg-secondary data-[state=open]:bg-secondary flex items-center justify-start gap-2 pl-4 text-sm"
                  )}
                  href={item.url}
                  onClick={(event) => {
                    event.preventDefault();
                    router.push(item.url);
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
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
