import { AgendaEvent, AgendaEventSource, AgendaEventStatus, AgendaEventType } from "@/types/agenda";

export const agendaTypeLabels: Record<AgendaEventType, string> = {
  appointment: "Compromisso",
  task: "Tarefa",
  maintenance: "Manutencao",
  inspection: "Vistoria",
  document: "Documento",
  contract: "Contrato",
  payment: "Pagamento",
  receipt: "Recebimento",
  reminder: "Lembrete",
  other: "Outro",
};

export const agendaSourceLabels: Record<AgendaEventSource, string> = {
  manual: "Manual",
  activity: "Tarefa legada",
  contract: "Contrato",
  financial: "Financeiro",
  document: "Documento",
  system: "Sistema",
};

export const agendaStatusLabels: Record<AgendaEventStatus, string> = {
  scheduled: "Agendado",
  in_progress: "Em andamento",
  completed: "Concluido",
  cancelled: "Cancelado",
  overdue: "Atrasado",
};

export function getAgendaEventTone(event: Pick<AgendaEvent, "type" | "status" | "cashflowDirection">) {
  if (event.status === "overdue") {
    return {
      dot: "bg-rose-500",
      chip: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
      rail: "bg-rose-500",
    };
  }

  if (event.status === "completed") {
    return {
      dot: "bg-emerald-600",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
      rail: "bg-emerald-600",
    };
  }

  if (event.type === "receipt" || event.cashflowDirection === "receivable") {
    return {
      dot: "bg-emerald-500",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
      rail: "bg-emerald-500",
    };
  }

  if (event.type === "payment" || event.cashflowDirection === "payable") {
    return {
      dot: "bg-amber-500",
      chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
      rail: "bg-amber-500",
    };
  }

  if (event.type === "contract") {
    return {
      dot: "bg-sky-500",
      chip: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
      rail: "bg-sky-500",
    };
  }

  if (event.type === "maintenance" || event.type === "inspection") {
    return {
      dot: "bg-teal-500",
      chip: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-200",
      rail: "bg-teal-500",
    };
  }

  return {
    dot: "bg-accent",
    chip: "border-accent/30 bg-accent/10 text-foreground",
    rail: "bg-accent",
  };
}
