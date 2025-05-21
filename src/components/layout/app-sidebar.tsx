
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingIcon, 
  FileTextIcon, 
  UserIcon,
  CalendarIcon,
  PieChartIcon,
  LayoutDashboardIcon,
  ActivityIcon,
  BanknoteIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboardIcon className="h-5 w-5" />,
    href: '/',
  },
  {
    title: 'Imóveis',
    icon: <BuildingIcon className="h-5 w-5" />,
    href: '/properties',
  },
  {
    title: 'Finanças',
    icon: <BanknoteIcon className="h-5 w-5" />,
    href: '/finances',
  },
  {
    title: 'Contratos',
    icon: <FileTextIcon className="h-5 w-5" />,
    href: '/contracts',
  },
  {
    title: 'Documentos',
    icon: <HomeIcon className="h-5 w-5" />,
    href: '/documents',
  },
  {
    title: 'Atividades',
    icon: <ActivityIcon className="h-5 w-5" />,
    href: '/activities',
  },
  {
    title: 'Calendário',
    icon: <CalendarIcon className="h-5 w-5" />,
    href: '/calendar',
  },
  {
    title: 'Usuários',
    icon: <UserIcon className="h-5 w-5" />,
    href: '/users',
    adminOnly: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex h-screen flex-col fixed left-0 top-0 z-10 w-64 bg-background border-r border-border">
      <div className="h-14 flex items-center px-4 border-b">
        <Link to="/" className="flex items-center space-x-2">
          <PieChartIcon className="h-6 w-6" />
          <span className="font-medium">ImobAdmin</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-auto">
        {sidebarItems.map((item) => {
          // Skip admin-only items for non-admin users
          if (item.adminOnly && !hasPermission('view_admin_pages')) {
            return null;
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        © 2023 ImobAdmin
      </div>
    </aside>
  );
}
