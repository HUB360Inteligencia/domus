import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck2, Inbox } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AgendaEvent } from "@/types/agenda";
import { AgendaEventCard } from "./agenda-event-card";

interface AgendaDayPanelProps {
  date: Date;
  events: AgendaEvent[];
  onRecordExpectedPayment?: (event: AgendaEvent) => void;
  recordingExpectedPaymentId?: string | null;
}

export function AgendaDayPanel({
  date,
  events,
  onRecordExpectedPayment,
  recordingExpectedPaymentId,
}: AgendaDayPanelProps) {
  const sortedEvents = [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <aside className="premium-panel dark:premium-panel-dark flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div>
          <div className="text-xs font-semibold uppercase text-accent">Dia selecionado</div>
          <h2 className="mt-1 text-lg font-semibold capitalize text-foreground">
            {format(date, "EEEE, dd 'de' MMM", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
          <CalendarCheck2 className="h-5 w-5" />
        </div>
      </div>

      <ScrollArea className="mt-4 flex-1 min-h-0 pr-3">
        {sortedEvents.length > 0 ? (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <AgendaEventCard
                key={event.id}
                event={event}
                onRecordExpectedPayment={onRecordExpectedPayment}
                isRecordingExpectedPayment={Boolean(
                  event.expectedPaymentId && recordingExpectedPaymentId === event.expectedPaymentId,
                )}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/45 px-4 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">Nenhum compromisso neste dia</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use Novo evento para registrar uma tarefa, pagamento ou compromisso.
            </p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
