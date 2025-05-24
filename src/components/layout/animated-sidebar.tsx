
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Building, 
  FileText, 
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

const AnimatedSidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar />
    </>
  );
};

const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-sidebar text-sidebar-foreground w-[300px] flex-shrink-0 border-r border-sidebar-border",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div className="h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-sidebar text-sidebar-foreground w-full border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-petroleum" />
          <span className="font-bold text-sm">Gestão Patrimonial</span>
        </div>
        <div className="flex justify-end z-20 relative">
          <Menu
            className="text-sidebar-foreground cursor-pointer h-6 w-6"
            onClick={() => setOpen(!open)}
          />
          
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute top-full right-0 mt-2 w-64 bg-sidebar border border-sidebar-border rounded-lg shadow-lg z-50",
                  className
                )}
              >
                <div className="p-2">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

const SidebarLink = ({
  link,
  className,
  isActive = false,
  ...props
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-2 px-2 rounded-md transition-all duration-200",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      <div className="h-5 w-5 flex-shrink-0">
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-nowrap"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export function AppSidebar() {
  const location = useLocation();
  const [financeSubmenuOpen, setFinanceSubmenuOpen] = useState(false);
  const { open, animate } = useSidebar();
  
  const menuItems: Links[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Imóveis",
      href: "/properties",
      icon: <Building className="h-5 w-5" />,
    },
    {
      label: "Contratos",
      href: "/contracts",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Atividades",
      href: "/activities",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      label: "Documentos",
      href: "/documents",
      icon: <FileBox className="h-5 w-5" />,
    },
    {
      label: "Usuários",
      href: "/users",
      icon: <User className="h-5 w-5" />,
    },
  ];

  const financeSubMenu: Links[] = [
    {
      label: "Painel",
      href: "/finances/dashboard",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      label: "Receitas",
      href: "/finances/income",
      icon: <ArrowUpCircle className="h-4 w-4" />,
    },
    {
      label: "Despesas",
      href: "/finances/expenses",
      icon: <ArrowDownCircle className="h-4 w-4" />,
    },
    {
      label: "Relatórios",
      href: "/finances/reports",
      icon: <Scroll className="h-4 w-4" />,
    }
  ];

  return (
    <AnimatedSidebar>
      <SidebarBody>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 p-2 mb-4">
            <Building className="h-8 w-8 text-petroleum flex-shrink-0" />
            <motion.div 
              className="flex flex-col"
              animate={{
                display: animate ? (open ? "flex" : "none") : "flex",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-bold text-sm">Gestão Patrimonial</span>
              <span className="text-xs text-muted-foreground">
                Versão 1.0
              </span>
            </motion.div>
          </div>
          
          {/* Menu Items */}
          <div className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <SidebarLink 
                key={item.label} 
                link={item} 
                isActive={location.pathname === item.href}
              />
            ))}
            
            {/* Finance Menu with Submenu */}
            <div 
              className="space-y-1"
              onMouseEnter={() => setFinanceSubmenuOpen(true)}
              onMouseLeave={() => setFinanceSubmenuOpen(false)}
            >
              <button
                onClick={() => setFinanceSubmenuOpen(!financeSubmenuOpen)}
                className="flex items-center justify-start gap-3 w-full py-2 px-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Wallet className="h-5 w-5 flex-shrink-0" />
                <motion.span
                  className="text-sm whitespace-nowrap"
                  animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  Finanças
                </motion.span>
              </button>
              
              <AnimatePresence>
                {financeSubmenuOpen && open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-6 space-y-1 overflow-hidden"
                  >
                    {financeSubMenu.map((item) => (
                      <SidebarLink 
                        key={item.label} 
                        link={item} 
                        isActive={location.pathname === item.href}
                        className="py-1"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* AI Section */}
            <div className="pt-4">
              <motion.div 
                className="text-xs font-medium text-sidebar-foreground/70 px-2 mb-2"
                animate={{
                  display: animate ? (open ? "block" : "none") : "block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                Inteligência artificial
              </motion.div>
              <SidebarLink 
                link={{
                  label: "Assistente IA",
                  href: "/ai-assistant",
                  icon: <MessageSquare className="h-5 w-5" />
                }}
                isActive={location.pathname === "/ai-assistant"}
              />
            </div>
            
            {/* System Section */}
            <div className="pt-4">
              <motion.div 
                className="text-xs font-medium text-sidebar-foreground/70 px-2 mb-2"
                animate={{
                  display: animate ? (open ? "block" : "none") : "block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                Sistema
              </motion.div>
              <SidebarLink 
                link={{
                  label: "Configurações",
                  href: "/admin/settings",
                  icon: <Settings className="h-5 w-5" />
                }}
                isActive={location.pathname === "/admin/settings"}
              />
            </div>
          </div>
          
          {/* Footer */}
          <motion.div 
            className="border-t border-sidebar-border pt-4 mt-4"
            animate={{
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src="" alt="Perfil" />
                <AvatarFallback className="bg-petroleum text-white">AP</AvatarFallback>
              </Avatar>
              <motion.div 
                className="flex flex-col min-w-0"
                animate={{
                  display: animate ? (open ? "flex" : "none") : "flex",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium truncate">Admin Principal</p>
                <p className="text-xs text-muted-foreground truncate">admin@exemplo.com</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </SidebarBody>
    </AnimatedSidebar>
  );
}
