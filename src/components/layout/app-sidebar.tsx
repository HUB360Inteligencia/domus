
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  FileText,
  LayoutDashboard,
  Users,
  CalendarRange,
  Menu,
  X,
  Settings,
  LogOut,
  TrendingUp,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth';
import { Sidebar as SidebarComponent } from '@/components/ui/sidebar';

export function AppSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Imóveis', href: '/properties', icon: <Building2 className="h-5 w-5" /> },
    { name: 'Contratos', href: '/contracts', icon: <File className="h-5 w-5" /> },
    { name: 'Documentos', href: '/documents', icon: <FileText className="h-5 w-5" /> },
    { 
      name: 'Financeiro', 
      href: '/finances', 
      icon: <TrendingUp className="h-5 w-5" />,
      subitems: [
        { name: 'Dashboard', href: '/finances/dashboard' },
        { name: 'Despesas', href: '/finances/expenses' },
        { name: 'Receitas', href: '/finances/income' },
        { name: 'Relatórios', href: '/finances/reports' },
      ] 
    },
    { name: 'Atividades', href: '/activities', icon: <CalendarRange className="h-5 w-5" /> },
    { name: 'Usuários', href: '/users', icon: <Users className="h-5 w-5" /> },
  ];

  // Extract the base path from location.pathname
  const basePath = '/' + location.pathname.split('/')[1];

  return (
    <>
      {/* Mobile navbar (top) */}
      <div className="flex lg:hidden items-center justify-between border-b px-4 h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 sm:max-w-xs p-0">
            <div className="p-6">
              <Link to="/" className="flex items-center gap-2 font-semibold text-lg" onClick={() => setOpen(false)}>
                <Home className="h-5 w-5" />
                <span>Imobapp</span>
              </Link>
            </div>
            <nav className="flex flex-col gap-1 px-2">
              {links.map((link) => (
                <React.Fragment key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                      isActive(link.href) ? "bg-accent text-accent-foreground" : "transparent"
                    )}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                  
                  {/* Sub items */}
                  {link.subitems && isActive(link.href) && (
                    <div className="ml-6 mt-1 border-l pl-2 flex flex-col gap-1">
                      {link.subitems.map((subitem) => (
                        <Link
                          key={subitem.href}
                          to={subitem.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all hover:bg-accent",
                            location.pathname === subitem.href ? "bg-accent/50 font-medium" : "transparent"
                          )}
                        >
                          <span>{subitem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={() => signOut()}>
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span>Imobapp</span>
        </Link>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>

      {/* Desktop sidebar */}
      <SidebarComponent className="hidden lg:flex border-r">
        <div className="flex flex-col h-full px-4 py-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg px-2">
            <Home className="h-5 w-5" />
            <span>Imobapp</span>
          </Link>
          <nav className="flex flex-col gap-1 mt-8 flex-1">
            {links.map((link) => (
              <React.Fragment key={link.href}>
                <Link
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    isActive(link.href) ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
                
                {/* Sub items */}
                {link.subitems && isActive(link.href) && (
                  <div className="ml-6 mt-1 border-l pl-2 flex flex-col gap-1">
                    {link.subitems.map((subitem) => (
                      <Link
                        key={subitem.href}
                        to={subitem.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all hover:bg-accent",
                          location.pathname === subitem.href ? "bg-accent/50 font-medium" : "transparent"
                        )}
                      >
                        <span>{subitem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
          <div className="flex flex-col gap-1 border-t pt-4 mt-auto">
            <div className="flex items-center justify-between px-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </SidebarComponent>
    </>
  );
}
