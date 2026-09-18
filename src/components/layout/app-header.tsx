import { Building2, CalendarDays, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUserClientId } from "@/hooks/use-client-users";
import { useClient } from "@/hooks/use-clients";

export function AppHeader() {
  const { data: currentClientId } = useCurrentUserClientId();
  const { data: currentClient } = useClient(currentClientId ?? undefined);

  const organizationName = currentClient?.name || "Domus Portfolio";

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(new Date())
    .replace(".", "");

  return (
    <header className="sticky top-0 z-30 hidden md:block mx-3 mt-4 md:mx-6 lg:mx-8">
      <div className="premium-panel dark:premium-panel-dark flex min-h-[72px] items-center gap-3 rounded-[2rem] px-4 py-3 backdrop-blur-xl">
        <div
          className="hidden min-w-0 max-w-[260px] items-center gap-2 rounded-2xl border border-white/60 bg-white/60 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex"
          title={organizationName}
        >
          <Building2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase leading-none text-muted-foreground/70">
              Organização
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
              {organizationName}
            </div>
          </div>
        </div>

        <GlobalSearch />

        <Link
          to="/agenda"
          aria-label="Abrir agenda de hoje"
          className="hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-white hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 xl:flex"
        >
          <CalendarDays className="h-4 w-4 text-accent" />
          {today}
        </Link>

        <Button
          size="sm"
          className="hidden h-11 px-4 sm:inline-flex"
          asChild
        >
          <Link to="/properties/new">
            <Plus className="h-4 w-4" />
            Novo ativo
          </Link>
        </Button>

        <NotificationCenter />

        <ThemeToggle />


      </div>
    </header>
  );
}
