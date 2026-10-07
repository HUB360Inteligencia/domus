import { Bell, Building2, CheckCircle2, CircleDollarSign, Clock, DollarSign, Loader2, Repeat2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { AgendaEvent } from "@/types/agenda";
import { agendaSourceLabels, agendaStatusLabels, agendaTypeLabels, getAgendaEventTone } from "./agenda-utils";

interface AgendaEventCardProps {
  event: AgendaEvent;
  compact?: boolean;
  onSettle?: (event: AgendaEvent) => void;
  isSettling?: boolean;
}

const settleLabel = (event: AgendaEvent) => {
  if (event.settlement?.kind === "rent") return "Registrar recebimento";
  if (event.settlement?.confirmOnly) return "Confirmar pagamento";
  return "Registrar pagamento";
};

const openLabel = (event: AgendaEvent) => (event.source === "contract" ? "Abrir contrato" : "Abrir imóvel");

function getEventUrl(event: AgendaEvent): string | null {
  if (event.source === "activity") return null;
  // Parcela da compra e conta do imóvel são resolvidas na ficha do imóvel.
  if (event.metadata?.obligationInstallmentId && event.propertyId) {
    return `/properties/${event.propertyId}?tab=obligations`;
  }
  if (event.metadata?.purchaseInstallmentId && event.propertyId) {
    return `/properties/${event.propertyId}?tab=financial`;
  }
  if (event.source === "contract" && (event.contractId || event.sourceId)) {
    return `/contracts/${event.contractId || event.sourceId}`;
  }
  if (event.source === "financial") return `/finances/transactions`;
  if (event.propertyId) return `/properties/${event.propertyId}`;
  return null;
}

export function AgendaEventCard({
  event,
  compact = false,
  onSettle,
  isSettling = false,
}: AgendaEventCardProps) {
  const tone = getAgendaEventTone(event);
  const url = getEventUrl(event);
  const canSettle = !compact && !event.isReconciled && Boolean(event.settlement) && Boolean(onSettle);

  const content = (
    <>
      <div className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full", tone.rail)} />
      <div className="min-w-0 pl-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cn("h-6 rounded-md px-2 text-[11px]", tone.chip)}>
                {agendaTypeLabels[event.type]}
              </Badge>
              {event.isPredicted && (
                <Badge variant="outline" className="h-6 rounded-md border-sky-200 bg-sky-50 px-2 text-[11px] text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                  Previsto
                </Badge>
              )}
              {event.isReconciled && (
                <Badge variant="outline" className="h-6 rounded-md border-emerald-200 bg-emerald-50 px-2 text-[11px] text-emerald-700">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Baixado
                </Badge>
              )}
            </div>
            <h3 className={cn("mt-2 truncate font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
              {event.title}
            </h3>
          </div>

          {event.amount != null && (
            <div className="shrink-0 rounded-md bg-background/80 px-2 py-1 text-right">
              <div className="flex items-center gap-1 text-xs font-semibold">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                {formatCurrency(event.amount)}
              </div>
            </div>
          )}
        </div>

        {!compact && event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {event.allDay ? "Dia inteiro" : format(new Date(event.startsAt), "HH:mm", { locale: ptBR })}
          </span>
          {event.propertyTitle && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[180px] truncate">{event.propertyTitle}</span>
            </span>
          )}
          {event.reminderAt && (
            <span className="inline-flex items-center gap-1">
              <Bell className="h-3.5 w-3.5" />
              Lembrete
            </span>
          )}
          {event.metadata?.recurring && (
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              Recorrente
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            {agendaStatusLabels[event.status]}
          </span>
          <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            {agendaSourceLabels[event.source]}
          </span>
        </div>

        {canSettle && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg"
              disabled={isSettling}
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
                onSettle?.(event);
              }}
            >
              {isSettling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CircleDollarSign className="h-4 w-4" />
              )}
              {settleLabel(event)}
            </Button>
            {url && (
              <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" asChild>
                <Link to={url}>{openLabel(event)}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );

  const baseClassName = "group relative block overflow-hidden rounded-lg border border-white/70 bg-white/78 p-3 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10";

  if (url && !canSettle) {
    return (
      <Link to={url} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <article className={baseClassName}>
      {content}
    </article>
  );
}
