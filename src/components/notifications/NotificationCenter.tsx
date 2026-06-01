import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle,
  ExternalLink,
  Info,
  Trash2,
  XCircle,
} from "lucide-react";

import { processDueAgendaReminders } from "@/api/agenda";
import { Notification } from "@/api/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const getNotificationIcon = (notification: Notification) => {
  if (notification.related_to === "agenda_event") {
    return <CalendarClock className="h-4 w-4 text-accent" />;
  }

  switch (notification.type) {
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "error":
      return <XCircle className="h-4 w-4 text-rose-600" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    default:
      return <Info className="h-4 w-4 text-sky-600" />;
  }
};

const getNotificationUrl = (notification: Notification) => {
  if (!notification.related_to || !notification.related_id) return null;

  switch (notification.related_to) {
    case "agenda_event":
      return "/agenda";
    case "contract":
      return `/contracts/${notification.related_id}`;
    case "property":
      return `/properties/${notification.related_id}`;
    case "financial_transaction":
      return "/finances/transactions";
    case "document":
      return "/documents";
    default:
      return null;
  }
};

const getRelatedLabel = (notification: Notification) => {
  switch (notification.related_to) {
    case "agenda_event":
      return "Agenda";
    case "contract":
      return "Contrato";
    case "property":
      return "Imovel";
    case "financial_transaction":
      return "Financeiro";
    case "document":
      return "Documento";
    default:
      return "Domus";
  }
};

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkExpirations,
    isMarkingAllAsRead,
    refetchNotifications,
  } = useNotifications();

  // Run the expiration/reminder sweep once when the center mounts.
  // checkExpirations is backed by a TanStack mutation whose object identity
  // changes on every render, so depending on it here would re-fire the effect
  // endlessly (each run invalidates ['notifications'] -> refetch -> re-render).
  const hasSweptRef = React.useRef(false);
  React.useEffect(() => {
    if (hasSweptRef.current) return;
    hasSweptRef.current = true;

    void checkExpirations();
    void processDueAgendaReminders().then((processed) => {
      if (processed > 0) void refetchNotifications();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenNotification = (notification: Notification) => {
    if (!notification.is_read) void markAsRead(notification.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-11 w-11 rounded-2xl" aria-label="Notificacoes">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl p-0">
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <h3 className="font-semibold text-foreground">Notificacoes</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} nao lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="h-9 w-9 rounded-xl"
              aria-label="Marcar todas como lidas"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="max-h-[420px]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center p-5 text-center text-muted-foreground">
              <Bell className="h-9 w-9 opacity-50" />
              <p className="mt-3 text-sm font-medium text-foreground">Nenhuma notificacao</p>
              <p className="mt-1 text-xs">Lembretes da Agenda aparecem aqui dentro do Domus.</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {notifications.map((notification) => {
                const url = getNotificationUrl(notification);
                const body = (
                  <>
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          "truncate text-sm font-medium",
                          notification.is_read ? "text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {notification.title}
                      </h4>
                      {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                    <p
                      className={cn(
                        "mt-1 line-clamp-2 text-xs",
                        notification.is_read ? "text-muted-foreground/75" : "text-muted-foreground",
                      )}
                    >
                      {notification.message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
                      <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}</span>
                      <span>/</span>
                      <span>{format(new Date(notification.created_at), "dd/MM HH:mm")}</span>
                      <span>/</span>
                      <span className="inline-flex items-center gap-1">
                        {getRelatedLabel(notification)}
                        {url && <ExternalLink className="h-3 w-3" />}
                      </span>
                    </div>
                  </>
                );

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-xl border p-3 transition-colors",
                      notification.is_read
                        ? "border-border/60 bg-muted/25"
                        : "border-accent/30 bg-accent/[0.07]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/80">
                        {getNotificationIcon(notification)}
                      </div>

                      <div className="min-w-0 flex-1">
                        {url ? (
                          <Link
                            to={url}
                            onClick={() => handleOpenNotification(notification)}
                            className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {body}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenNotification(notification)}
                            className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {body}
                          </button>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void markAsRead(notification.id)}
                            className="h-8 w-8 rounded-lg"
                            aria-label="Marcar como lida"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void deleteNotification(notification.id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                          aria-label="Excluir notificacao"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button variant="ghost" size="sm" className="h-9 w-full justify-between rounded-xl text-xs" asChild>
            <Link to="/agenda">
              Abrir agenda
              <CalendarClock className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
