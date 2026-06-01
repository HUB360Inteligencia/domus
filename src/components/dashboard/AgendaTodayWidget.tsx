import React from "react";
import { Link } from "react-router-dom";
import { addDays, endOfDay, format, formatDistanceToNow, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  WalletCards,
} from "lucide-react";

import { SimpleToggle } from "@/components/finances/dashboard/SimpleToggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgenda } from "@/hooks/use-agenda";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AgendaEvent } from "@/types/agenda";

const viewOptions = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "7 dias" },
];

const eventIcon = (event: AgendaEvent) => {
  if (event.type === "receipt") return CircleDollarSign;
  if (event.type === "payment") return WalletCards;
  if (event.status === "overdue") return Clock3;
  return CalendarClock;
};

const eventTone = (event: AgendaEvent) => {
  if (event.status === "overdue") return "bg-rose-100 text-rose-700";
  if (event.type === "receipt") return "bg-emerald-100 text-emerald-700";
  if (event.type === "payment") return "bg-amber-100 text-amber-800";
  return "bg-primary/10 text-primary";
};

function AgendaRow({
  event,
  onRecordExpectedPayment,
  recordingExpectedPaymentId,
}: {
  event: AgendaEvent;
  onRecordExpectedPayment: (event: AgendaEvent) => void;
  recordingExpectedPaymentId?: string | null;
}) {
  const Icon = eventIcon(event);
  const date = parseISO(event.startsAt);
  const canRecord = event.type === "receipt" && event.isPredicted && !event.isReconciled && event.expectedPaymentId;
  const isRecording = Boolean(event.expectedPaymentId && recordingExpectedPaymentId === event.expectedPaymentId);

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/55 px-3 py-3 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/85 dark:border-white/10 dark:bg-white/5">
      <Link
        to="/agenda"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl", eventTone(event))}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{event.title}</div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{isSameDay(date, new Date()) ? "Hoje" : formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}</span>
            {event.amount != null && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span>{formatCurrency(event.amount)}</span>
              </>
            )}
            {event.propertyTitle && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="max-w-[150px] truncate">{event.propertyTitle}</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {canRecord ? (
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0 rounded-2xl px-3"
          disabled={isRecording}
          onClick={() => onRecordExpectedPayment(event)}
        >
          {isRecording ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Baixar
        </Button>
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}

export function AgendaTodayWidget() {
  const [viewMode, setViewMode] = React.useState<"today" | "week">("today");
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const range = React.useMemo(
    () => ({
      start: today,
      end: endOfDay(addDays(today, 7)),
    }),
    [today],
  );

  const {
    events,
    isLoading,
    recordExpectedPayment,
    recordingExpectedPaymentId,
  } = useAgenda(range);

  const todayEvents = React.useMemo(
    () => events.filter((event) => isSameDay(parseISO(event.startsAt), today)),
    [events, today],
  );

  const overdueEvents = React.useMemo(
    () => events.filter((event) => event.status === "overdue"),
    [events],
  );

  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => {
        const date = parseISO(event.startsAt);
        return date >= startOfDay(now) && event.status !== "cancelled";
      })
      .sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime());
  }, [events]);

  const receivableAmount = React.useMemo(
    () =>
      events
        .filter((event) => event.cashflowDirection === "receivable" && !event.isReconciled)
        .reduce((sum, event) => sum + Number(event.amount || 0), 0),
    [events],
  );

  const displayEvents = (viewMode === "today" ? todayEvents : upcomingEvents).slice(0, 5);

  const handleRecordExpectedPayment = async (event: AgendaEvent) => {
    if (!event.expectedPaymentId) return;
    await recordExpectedPayment(event.expectedPaymentId);
  };

  if (isLoading) {
    return (
      <section className="premium-panel dark:premium-panel-dark h-full min-h-[360px] rounded-[2.5rem] p-5">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-3xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="premium-panel dark:premium-panel-dark h-full min-h-[360px] rounded-[2.5rem] p-5">
      <div className="mb-4 flex flex-shrink-0 items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Agenda</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Hoje no Domus</h3>
        </div>
        <div className="flex items-center gap-2">
          <SimpleToggle
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "today" | "week")}
            options={viewOptions}
            className="h-9 rounded-2xl bg-white/60 p-1 text-xs dark:bg-white/5"
          />
          <Button size="sm" className="h-9 w-9 rounded-2xl p-0" aria-label="Novo evento" asChild>
            <Link to="/agenda?new=1">
              <CalendarClock className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/5">
          <p className="text-[11px] text-muted-foreground">Hoje</p>
          <p className="mt-1 text-lg font-semibold">{todayEvents.length}</p>
        </div>
        <div className="rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/5">
          <p className="text-[11px] text-muted-foreground">Atrasados</p>
          <p className="mt-1 text-lg font-semibold">{overdueEvents.length}</p>
        </div>
        <div className="rounded-2xl bg-white/55 px-3 py-2 dark:bg-white/5">
          <p className="text-[11px] text-muted-foreground">A receber</p>
          <p className="mt-1 truncate text-sm font-semibold">{formatCurrency(receivableAmount)}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {displayEvents.length === 0 ? (
          <div className="flex min-h-[176px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 px-4 text-center text-muted-foreground">
            <CalendarClock className="mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">
              {viewMode === "today" ? "Nada marcado para hoje" : "Sem eventos nos proximos 7 dias"}
            </p>
            <p className="mt-1 text-xs">{format(today, "dd/MM/yyyy")}</p>
          </div>
        ) : (
          displayEvents.map((event) => (
            <AgendaRow
              key={event.id}
              event={event}
              onRecordExpectedPayment={handleRecordExpectedPayment}
              recordingExpectedPaymentId={recordingExpectedPaymentId}
            />
          ))
        )}
      </div>

      <div className="mt-4 flex-shrink-0 border-t border-border/70 pt-3">
        <Button variant="ghost" size="sm" className="h-9 w-full text-xs" asChild>
          <Link to="/agenda">
            Abrir agenda completa
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
