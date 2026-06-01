
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronLeft, ChevronDown, LogOut, Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building, 
  CalendarDays,
  FileText, 
  Users, 
  Settings,
  Home,
  FileBox,
  Wallet,
  LineChart,
  Scroll,
  BarChart3,
  Sparkles,
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth as useAuthHook } from "@/lib/auth";

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
  const [openState, setOpenState] = useState(true);

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

// Tooltip component for collapsed sidebar
const SidebarTooltip = ({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) => {
  const [hovering, setHovering] = useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {children}
      <AnimatePresence>
        {show && hovering && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none"
          >
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 76;

const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const [hoveringToggle, setHoveringToggle] = useState(false);
  
  return (
    <motion.div
      className={cn(
        "sticky top-0 hidden h-screen min-h-screen md:flex md:flex-col flex-shrink-0 select-none",
        "premium-sidebar text-sidebar-foreground",
        className
      )}
      animate={{
        width: SIDEBAR_EXPANDED,
      }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      {...props}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {children}
      </div>
      
      {/* Toggle button — hidden but preserved for future use */}
      {false && animate && (
        <div 
          className="absolute -right-4 top-0 bottom-0 w-8 z-50 flex items-start pt-7"
          onMouseEnter={() => setHoveringToggle(true)}
          onMouseLeave={() => setHoveringToggle(false)}
        >
          <motion.button
            onClick={() => setOpen(!open)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-2xl cursor-pointer",
              "border border-white/70 bg-white/90 text-sidebar-foreground",
              "shadow-[0_14px_35px_-24px_rgba(31,27,24,0.9)] hover:shadow-xl",
              "transition-colors duration-150",
              "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
            )}
            initial={false}
            animate={{ 
              opacity: hoveringToggle ? 1 : 0,
              scale: hoveringToggle ? 1 : 0.8
            }}
            transition={{ duration: 0.15 }}
            aria-label={open ? "Recolher menu" : "Expandir menu"}
          >
            <ChevronLeft 
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300 ease-out",
                !open && "rotate-180"
              )} 
            />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

const MobileSidebar = () => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      {/* Mobile Header Bar — Hamburger left, Logo center, Bell right */}
      <div className="fixed top-0 left-0 right-0 h-14 px-3 flex flex-row md:hidden items-center justify-between bg-sidebar/95 text-sidebar-foreground w-full border-b border-sidebar-border z-50 backdrop-blur-lg">
        {/* Left: Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="h-10 w-10 flex justify-center items-center rounded-xl hover:bg-sidebar-accent/60 active:scale-95 transition-all duration-150"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? (
            <X className="text-sidebar-foreground h-5 w-5" />
          ) : (
            <Menu className="text-sidebar-foreground h-5 w-5" />
          )}
        </button>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="premium-gradient h-8 w-8 rounded-xl flex items-center justify-center shadow-md">
            <img src="/brand/domus-symbol-white.svg" alt="" className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Domus</span>
        </div>

        {/* Right: Notification bell */}
        <button
          className="h-10 w-10 flex justify-center items-center rounded-xl hover:bg-sidebar-accent/60 active:scale-95 transition-all duration-150"
          aria-label="Notificações"
        >
          <Bell className="text-sidebar-foreground h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Mobile spacer for fixed header */}
      <div className="h-14 md:hidden" />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="premium-sidebar fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-72 border-r border-sidebar-border z-50 md:hidden overflow-y-auto shadow-[20px_0_60px_-30px_rgba(0,0,0,0.7)]"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 p-3 overflow-y-auto">
                  <SidebarMenuContent />
                </div>
                {/* Mobile sidebar footer with user info */}
                <MobileSidebarFooter />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/** Compact user info at the bottom of the mobile slide-out menu */
const MobileSidebarFooter = () => {
  const { user, signOut } = useAuthHook();
  const { setOpen } = useSidebar();

  const displayName = user?.profile
    ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ') || 'Usuário'
    : 'Usuário';

  const initials = user?.profile
    ? [user.profile.first_name?.[0], user.profile.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'U'
    : 'U';

  return (
    <div className="border-t border-sidebar-border/50 px-3 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0 ring-1 ring-sidebar-border">
          <AvatarImage src={user?.profile?.avatar_url || ''} alt="Perfil" />
          <AvatarFallback className="bg-[linear-gradient(135deg,#242021,#c4934f)] text-white text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate text-sidebar-foreground">{displayName}</p>
        </div>
        <button 
          onClick={() => { signOut(); setOpen(false); }}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 flex-shrink-0"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
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
  const { open, animate, setOpen } = useSidebar();
  
  return (
    <SidebarTooltip label={link.label} show={!open}>
      <Link
        to={link.href}
        onClick={() => {
          if (window.innerWidth < 768) {
            setOpen(false);
          }
        }}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl transition-[background-color,color,transform] duration-200",
          "h-11",
          open ? "px-3" : "px-0 justify-center",
          isActive 
            ? "bg-[linear-gradient(135deg,#242021_0%,#5a3827_58%,#c4934f_100%)] text-white font-semibold shadow-[0_18px_38px_-24px_rgba(80,52,31,0.95)]" 
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10",
          className
        )}
        {...props}
      >
        {/* Active indicator bar — removed: brown gradient is sufficient */}
        
        <div className={cn(
          "h-5 w-5 flex-shrink-0 flex items-center justify-center transition-transform duration-200",
          !isActive && "group-hover:scale-110"
        )}>
          {link.icon}
        </div>
        
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.15 }}
          className="text-[13px] whitespace-nowrap leading-none"
        >
          {link.label}
        </motion.span>
      </Link>
    </SidebarTooltip>
  );
};

const SectionLabel = ({ label }: { label: string }) => {
  const { open, animate } = useSidebar();
  
  return (
    <motion.div 
      className="px-3 pt-5 pb-1.5"
      animate={{
        opacity: animate ? (open ? 1 : 0) : 1,
        height: animate ? (open ? "auto" : 0) : "auto",
      }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-[10px] font-semibold uppercase text-sidebar-foreground/45">
        {label}
      </span>
    </motion.div>
  );
};

const SectionDivider = () => {
  const { open } = useSidebar();
  return (
    <div className={cn("py-2", open ? "px-3" : "px-2")}>
      <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
    </div>
  );
};

const SidebarMenuContent = () => {
  const location = useLocation();
  const [financeSubmenuOpen, setFinanceSubmenuOpen] = useState(false);
  const { open, animate, setOpen } = useSidebar();
  const { user } = useAuthHook();
  
  const isSystemAdmin = user?.role === 'system_admin';
  const isOrgAdmin = user?.role === 'admin';
  
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
      label: "Locações",
      href: "/contracts",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Contatos",
      href: "/contacts",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Agenda",
      href: "/agenda",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      label: "Documentos",
      href: "/documents",
      icon: <FileBox className="h-5 w-5" />,
    },
  ];

  const financeSubMenu: Links[] = [
    {
      label: "Dashboard",
      href: "/finances/dashboard",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      label: "Transações",
      href: "/finances/transactions",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "Relatórios",
      href: "/finances/reports",
      icon: <Scroll className="h-4 w-4" />,
    }
  ];

  const isFinanceActive = location.pathname.startsWith('/finances');
  const isUsersActive = location.pathname.startsWith('/users');

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-0.5">
        {!isSystemAdmin && (
          <>
        {menuItems.map((item) => (
          <SidebarLink 
            key={item.label} 
            link={item} 
            isActive={location.pathname === item.href || (item.href === "/agenda" && location.pathname.startsWith("/activities")) || (item.href === "/contacts" && location.pathname.startsWith("/contacts"))}
          />
        ))}
        
        {/* Finance Menu with Submenu */}
        <SidebarTooltip label="Finanças" show={!open}>
          <button
            onClick={() => {
              setFinanceSubmenuOpen(!financeSubmenuOpen);
              if (!open) setOpen(true);
            }}
            aria-label="Financas"
            className={cn(
              "group relative flex items-center gap-3 w-full rounded-2xl transition-[background-color,color,transform] duration-200",
              "h-11",
              open ? "px-3" : "px-0 justify-center",
              isFinanceActive 
                ? "bg-[linear-gradient(135deg,#242021_0%,#5a3827_58%,#c4934f_100%)] text-white font-semibold shadow-[0_18px_38px_-24px_rgba(80,52,31,0.95)]" 
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
            )}
          >
            {/* Active indicator bar — removed: brown gradient is sufficient */}
            <div className={cn(
              "h-5 w-5 flex-shrink-0 flex items-center justify-center transition-transform duration-200",
              !isFinanceActive && "group-hover:scale-110"
            )}>
              <Wallet className="h-5 w-5" />
            </div>
            <motion.span
              className="text-[13px] whitespace-nowrap leading-none"
              animate={{
                display: animate ? (open ? "inline-block" : "none") : "inline-block",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              transition={{ duration: 0.15 }}
            >
              Finanças
            </motion.span>
            <motion.div
              animate={{
                display: animate ? (open ? "flex" : "none") : "flex",
                opacity: animate ? (open ? 1 : 0) : 1,
                rotate: financeSubmenuOpen ? 180 : 0
              }}
              transition={{ duration: 0.2 }}
              className="ml-auto"
            >
              <ChevronDown className="h-3.5 w-3.5 text-current/70" />
            </motion.div>
          </button>
        </SidebarTooltip>
        
        <AnimatePresence>
          {financeSubmenuOpen && (open || window.innerWidth < 768) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="ml-4 pl-3 border-l-2 border-sidebar-border/70 space-y-1 py-1">
                {financeSubMenu.map((item) => (
                  <SidebarLink 
                    key={item.label} 
                    link={item} 
                    isActive={location.pathname === item.href}
                    className="h-8"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}
      </div>
      
      {/* AI Section */}
      {!isSystemAdmin && (
        <>
      <SectionDivider />
      <SectionLabel label="Inteligência artificial" />
      <SidebarLink 
        link={{
          label: "Assistente IA",
          href: "/ai-assistant",
          icon: <Sparkles className="h-5 w-5" />,
        }}
        isActive={location.pathname === "/ai-assistant"}
      />
        </>
      )}

      {/* Administração da Organização */}
      {!isSystemAdmin && isOrgAdmin && (
        <>
          <SectionDivider />
          <SectionLabel label="Administração" />
          <SidebarLink 
            link={{
              label: "Equipe & Acessos",
              href: "/settings/organization",
              icon: <Users className="h-5 w-5" />,
            }}
            isActive={location.pathname === "/settings/organization"}
          />
        </>
      )}
      
      {/* Painel SaaS */}
      {isSystemAdmin && (
        <>
          <SectionLabel label="Administração Domus" />
          <div className="space-y-0.5">
            <SidebarLink 
              link={{
                label: "Painel Domus",
                href: "/admin",
                icon: <BarChart3 className="h-5 w-5" />,
              }}
              isActive={location.pathname === "/admin"}
            />
            <SidebarLink 
              link={{
                label: "Organizações",
                href: "/admin/clients",
                icon: <Building className="h-5 w-5" />,
              }}
              isActive={location.pathname.startsWith("/admin/clients")}
            />
            <SidebarLink 
              link={{
                label: "Usuários & Acessos",
                href: "/users",
                icon: <Users className="h-5 w-5" />,
              }}
              isActive={isUsersActive}
            />
            <SidebarLink 
              link={{
                label: "Configurações",
                href: "/admin/settings",
                icon: <Settings className="h-5 w-5" />,
              }}
              isActive={location.pathname === "/admin/settings"}
            />
          </div>
        </>
      )}
    </div>
  );
};

const SidebarHeader = () => {
  const { open, animate } = useSidebar();
  
  return (
    <div className={cn(
      "flex items-center gap-2.5 h-20 flex-shrink-0 transition-[padding] duration-200",
      open ? "px-4" : "px-0 justify-center"
    )}>
      <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[linear-gradient(135deg,#242021_0%,#5a3827_55%,#c4934f_100%)] shadow-[0_18px_34px_-20px_rgba(80,52,31,0.9)]">
        <img src="/brand/domus-symbol-white.svg" alt="" className="h-7 w-7" aria-hidden="true" />
      </div>
      <motion.div 
        className="flex flex-col min-w-0"
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <span className="font-semibold text-base text-sidebar-foreground">Domus</span>
        <span className="text-[10px] uppercase text-sidebar-foreground/50 leading-tight">
          Gestão Patrimonial
        </span>
      </motion.div>
    </div>
  );
};

const SidebarFooter = () => {
  const { open, animate } = useSidebar();
  const { user, signOut } = useAuthHook();

  const displayName = user?.profile
    ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ') || 'Usuário'
    : 'Usuário';

  const initials = user?.profile
    ? [user.profile.first_name?.[0], user.profile.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'U'
    : 'U';

  const displayEmail = user?.email || '';

  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'system_admin';

  return (
    <div className="mt-auto border-t border-sidebar-border/65 px-2 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn(
            "flex items-center gap-2.5 h-16 rounded-3xl border border-transparent hover:border-white/55 bg-transparent hover:bg-white/45 transition-all duration-200 dark:hover:border-white/10 dark:hover:bg-white/5 cursor-pointer",
            open ? "px-3" : "px-0 justify-center"
          )}>
            <SidebarTooltip label={displayName} show={!open}>
              <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-sidebar-border hover:ring-sidebar-primary/60 transition-[box-shadow] duration-200">
                <AvatarImage src={user?.profile?.avatar_url || ''} alt="Perfil" />
                <AvatarFallback className="bg-[linear-gradient(135deg,#242021,#c4934f)] text-white text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </SidebarTooltip>
            
            <motion.div 
              className="flex items-center gap-2 flex-1 min-w-0"
              animate={{
                display: animate ? (open ? "flex" : "none") : "flex",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate text-sidebar-foreground">{displayName}</p>
                <p className="text-[11px] text-sidebar-foreground/55 truncate">{displayEmail}</p>
              </div>
            </motion.div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-2xl border-white/70 bg-popover/95 p-2 shadow-[0_24px_70px_-40px_rgba(31,27,24,0.8)] backdrop-blur"
          align="start"
          side="right"
          sideOffset={8}
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate('/settings/organization')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações da Organização</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function AppSidebar() {
  return (
    <AnimatedSidebar>
      <SidebarBody>
        <SidebarHeader />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 scrollbar-hide">
          <SidebarMenuContent />
        </div>
        
        <SidebarFooter />
      </SidebarBody>
    </AnimatedSidebar>
  );
}
