
import { Activity, ActivityStatus, ActivityPriority, ActivityType } from "@/types/activity";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function getActivityStatusLabel(status: ActivityStatus): string {
  const statusMap: Record<ActivityStatus, string> = {
    pending: "A Fazer",
    in_progress: "Em Andamento",
    completed: "Concluído",
    canceled: "Cancelado"
  };
  
  return statusMap[status] || status;
}

export function getActivityPriorityLabel(priority: ActivityPriority): string {
  const priorityMap: Record<ActivityPriority, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta"
  };
  
  return priorityMap[priority] || priority;
}

export function getActivityTypeLabel(type: ActivityType): string {
  const typeMap: Record<ActivityType, string> = {
    maintenance: "Manutenção",
    contract: "Contrato",
    payment: "Pagamento",
    visit: "Visita",
    documentation: "Documentação",
    other: "Outro"
  };
  
  return typeMap[type] || type;
}

export function formatActivityDate(dateString: string | null): string {
  if (!dateString) return "Não definido";
  
  try {
    const date = typeof dateString === "string" 
      ? parseISO(dateString)
      : new Date(dateString);
      
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Data inválida";
  }
}

export function getPriorityColor(priority: ActivityPriority): string {
  switch (priority) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-amber-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}

export function getStatusColor(status: ActivityStatus): string {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "in_progress":
      return "text-blue-600";
    case "pending":
      return "text-amber-600";
    case "canceled":
      return "text-gray-500";
    default:
      return "text-gray-600";
  }
}
