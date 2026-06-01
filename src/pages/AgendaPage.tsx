import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, Clock3, Landmark, Plus, WalletCards } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { AgendaCalendarGrid } from "@/components/agenda/agenda-calendar-grid";
import { AgendaDayPanel } from "@/components/agenda/agenda-day-panel";
import { AgendaEventDialog } from "@/components/agenda/agenda-event-dialog";
import { AgendaFilters } from "@/components/agenda/agenda-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgenda } from "@/hooks/use-agenda";
import { useContracts } from "@/hooks/use-contracts";
import { useProperties } from "@/hooks/use-properties";
import { formatCurrency } from "@/lib/format";
import { AgendaEventInput } from "@/types/agenda";

function SummaryTile({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          <div className="mt-2 truncate text-2xl font-semibold text-foreground">{value}</div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const range = useMemo(
    () => ({
      start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
    }),
    [month],
  );

  const {
    filteredEvents,
    eventsByDay,
    summary,
    filters,
    setFilters,
    isLoading,
    isFetching,
    createEvent,
    isCreatingEvent,
    recordExpectedPayment,
    recordingExpectedPaymentId,
  } = useAgenda(range);

  const { properties } = useProperties();
  const { contracts } = useContracts();

  const propertyOptions = useMemo(
    () => properties.map((property) => ({ label: property.title, value: property.id })),
    [properties],
  );

  const contractOptions = useMemo(
    () =>
      contracts.map((contract) => ({
        label: contract.title,
        value: contract.id,
        propertyId: contract.property_id,
      })),
    [contracts],
  );

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedEvents = eventsByDay[selectedKey] || [];
  const routeRequestsNewEvent = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return location.pathname.endsWith("/new") || params.get("new") === "1";
  }, [location.pathname, location.search]);

  const nextEvents = useMemo(
    () => filteredEvents.filter((event) => parseISO(event.startsAt) >= new Date()).slice(0, 5),
    [filteredEvents],
  );

  useEffect(() => {
    if (routeRequestsNewEvent) setDialogOpen(true);
  }, [routeRequestsNewEvent]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (!isSameMonth(date, month)) setMonth(date);
  };

  const handleCreateEvent = async (input: AgendaEventInput) => {
    await createEvent(input);
    setDialogOpen(false);
    if (routeRequestsNewEvent) navigate("/agenda", { replace: true });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && routeRequestsNewEvent) navigate("/agenda", { replace: true });
  };

  const handleRecordExpectedPayment = async (event: { expectedPaymentId?: string | null }) => {
    if (!event.expectedPaymentId) return;
    await recordExpectedPayment(event.expectedPaymentId);
  };

  return (
    <div className="space-y-5">
      <section className="premium-panel dark:premium-panel-dark rounded-3xl p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-accent">
              <CalendarDays className="h-4 w-4" />
              Agenda operacional
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Agenda
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Datas de pagamento, recebimentos previstos, compromissos, contratos e tarefas em uma leitura unica do portfolio.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => handleSelectDate(new Date())}>
              <Clock3 className="h-4 w-4" />
              Hoje
            </Button>
            <Button className="h-11 rounded-xl" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo evento
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Hoje"
            value={String(summary.todayCount)}
            helper="eventos no dia atual"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <SummaryTile
            label="Atrasados"
            value={String(summary.overdueCount)}
            helper="pendencias fora do prazo"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <SummaryTile
            label="A receber"
            value={formatCurrency(summary.receivableAmount)}
            helper={`${summary.predictedReceipts} previsoes de contratos`}
            icon={<Landmark className="h-5 w-5" />}
          />
          <SummaryTile
            label="A pagar"
            value={formatCurrency(summary.payableAmount)}
            helper="compromissos e despesas no periodo"
            icon={<WalletCards className="h-5 w-5" />}
          />
        </div>
      </section>

      <AgendaFilters filters={filters} propertyOptions={propertyOptions} onChange={setFilters} />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[720px] rounded-2xl" />
          <Skeleton className="h-[620px] rounded-2xl" />
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <AgendaCalendarGrid
            month={month}
            selectedDate={selectedDate}
            eventsByDay={eventsByDay}
            onMonthChange={setMonth}
            onSelectDate={handleSelectDate}
          />
          <AgendaDayPanel
            date={selectedDate}
            events={selectedEvents}
            onRecordExpectedPayment={handleRecordExpectedPayment}
            recordingExpectedPaymentId={recordingExpectedPaymentId}
          />
        </div>
      )}

      {!isLoading && nextEvents.length > 0 && (
        <section className="premium-panel dark:premium-panel-dark rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase text-accent">Proximos passos</div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Fila operacional</h2>
            </div>
            {isFetching && <span className="text-xs text-muted-foreground">Atualizando...</span>}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {nextEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => handleSelectDate(parseISO(event.startsAt))}
                className="min-w-0 rounded-lg border border-white/70 bg-white/60 p-3 text-left transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="truncate text-sm font-semibold text-foreground">{event.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {format(parseISO(event.startsAt), "dd/MM")}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <AgendaEventDialog
        open={dialogOpen}
        selectedDate={selectedDate}
        isSubmitting={isCreatingEvent}
        propertyOptions={propertyOptions}
        contractOptions={contractOptions}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}
