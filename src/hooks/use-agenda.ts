import { useMemo, useState } from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancialData } from "@/lib/query-invalidation";
import { toast } from "sonner";

import {
  createAgendaEvent,
  fetchAgendaEvents,
  processDueAgendaReminders,
  recordExpectedContractPayment,
} from "@/api/agenda";
import { recordPurchaseInstallment } from "@/api/property-purchase-installments";
import { recordObligationPayment } from "@/api/property-obligations";
import {
  AgendaDateRange,
  AgendaEvent,
  AgendaEventInput,
  AgendaFilters,
  AgendaSettlement,
  AgendaSummary,
} from "@/types/agenda";

/** Baixa pelo RPC de cada tipo de item previsto. Data de hoje e valor cheio. */
const settle = async (settlement: AgendaSettlement): Promise<unknown> => {
  switch (settlement.kind) {
    case "rent":
      return recordExpectedContractPayment(settlement.id);
    case "purchase_installment":
      return recordPurchaseInstallment(settlement.id);
    case "obligation_installment":
      return recordObligationPayment(settlement.id);
  }
};

const settledMessage = (settlement: AgendaSettlement) => {
  if (settlement.kind === "rent") return "Recebimento registrado no financeiro";
  if (settlement.confirmOnly) return "Pagamento do inquilino confirmado";
  return "Pagamento registrado no financeiro";
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const eventMatchesFilters = (event: AgendaEvent, filters: AgendaFilters) => {
  if (filters.type && filters.type !== "all" && event.type !== filters.type) return false;
  if (filters.source && filters.source !== "all" && event.source !== filters.source) return false;
  if (filters.status && filters.status !== "all" && event.status !== filters.status) return false;
  if (filters.propertyId && filters.propertyId !== "all" && event.propertyId !== filters.propertyId) return false;

  if (filters.search) {
    const query = normalizeText(filters.search);
    const searchable = [
      event.title,
      event.description,
      event.propertyTitle,
      event.contractTitle,
      event.tenantName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!searchable.includes(query)) return false;
  }

  return true;
};

const buildSummary = (events: AgendaEvent[]): AgendaSummary => {
  const today = startOfDay(new Date());

  return events.reduce<AgendaSummary>(
    (summary, event) => {
      if (isSameDay(parseISO(event.startsAt), today)) summary.todayCount += 1;
      if (event.status === "overdue") summary.overdueCount += 1;
      if (event.cashflowDirection === "receivable") summary.receivableAmount += Number(event.amount || 0);
      if (event.cashflowDirection === "payable") summary.payableAmount += Number(event.amount || 0);
      if (event.isPredicted) summary.predictedReceipts += 1;
      if (event.reminderAt && event.reminderStatus !== "dismissed") summary.internalReminders += 1;
      return summary;
    },
    {
      todayCount: 0,
      overdueCount: 0,
      receivableAmount: 0,
      payableAmount: 0,
      predictedReceipts: 0,
      internalReminders: 0,
    },
  );
};

export function useAgenda(range: AgendaDateRange) {
  const [filters, setFilters] = useState<AgendaFilters>({
    type: "all",
    source: "all",
    status: "all",
    propertyId: "all",
  });
  const queryClient = useQueryClient();

  const queryKey = ["agenda-events", range.start.toISOString(), range.end.toISOString()];

  const {
    data: events = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const processedReminders = await processDueAgendaReminders();
      if (processedReminders > 0) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
      return fetchAgendaEvents(range);
    },
  });

  const filteredEvents = useMemo(
    () => events.filter((event) => eventMatchesFilters(event, filters)),
    [events, filters],
  );

  const summary = useMemo(() => buildSummary(filteredEvents), [filteredEvents]);

  const eventsByDay = useMemo(() => {
    return filteredEvents.reduce<Record<string, AgendaEvent[]>>((grouped, event) => {
      const key = event.startsAt.slice(0, 10);
      grouped[key] = grouped[key] || [];
      grouped[key].push(event);
      return grouped;
    }, {});
  }, [filteredEvents]);

  const createEventMutation = useMutation({
    mutationFn: (input: AgendaEventInput) => createAgendaEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-events"] });
      toast.success("Evento criado na agenda");
    },
    onError: () => {
      toast.error("Não foi possível criar o evento");
    },
  });

  const settleMutation = useMutation({
    mutationFn: (event: AgendaEvent) => {
      if (!event.settlement) throw new Error("Este item não aceita baixa pela Agenda");
      return settle(event.settlement);
    },
    onSuccess: (_data, event) => {
      queryClient.invalidateQueries({ queryKey: ["agenda-events"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void invalidateFinancialData(queryClient);
      if (event.settlement) toast.success(settledMessage(event.settlement));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a baixa");
    },
  });

  return {
    events,
    filteredEvents,
    eventsByDay,
    summary,
    filters,
    setFilters,
    isLoading,
    isFetching,
    createEvent: createEventMutation.mutateAsync,
    isCreatingEvent: createEventMutation.isPending,
    settleEvent: settleMutation.mutateAsync,
    /** id do evento em baixa agora, para o botão certo mostrar o carregamento. */
    settlingEventId: settleMutation.isPending ? settleMutation.variables?.id ?? null : null,
    isSettling: settleMutation.isPending,
  };
}
