export type AgendaEventSource = "manual" | "activity" | "contract" | "financial" | "document" | "system";

export type AgendaEventType =
  | "appointment"
  | "task"
  | "maintenance"
  | "inspection"
  | "document"
  | "contract"
  | "payment"
  | "receipt"
  | "reminder"
  | "other";

export type AgendaEventStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "overdue";
export type AgendaEventPriority = "low" | "medium" | "high";
export type AgendaCashflowDirection = "receivable" | "payable";

/**
 * Item previsto que aceita baixa direto da Agenda: recebimento de aluguel,
 * parcela da compra ou conta do imóvel. Cada tipo tem seu RPC de baixa.
 */
export type AgendaSettlementKind = "rent" | "purchase_installment" | "obligation_installment";

export interface AgendaSettlement {
  kind: AgendaSettlementKind;
  id: string;
  /** Conta paga pelo inquilino: a baixa só confirma, sem lançar despesa. */
  confirmOnly?: boolean;
}

export interface AgendaEvent {
  id: string;
  source: AgendaEventSource;
  sourceId?: string | null;
  title: string;
  description?: string | null;
  type: AgendaEventType;
  status: AgendaEventStatus;
  priority: AgendaEventPriority;
  startsAt: string;
  endsAt?: string | null;
  allDay: boolean;
  amount?: number | null;
  cashflowDirection?: AgendaCashflowDirection | null;
  propertyId?: string | null;
  propertyTitle?: string | null;
  contractId?: string | null;
  contractTitle?: string | null;
  tenantName?: string | null;
  expectedPaymentId?: string | null;
  /** Presente enquanto o item previsto está em aberto e pode receber baixa. */
  settlement?: AgendaSettlement | null;
  financialTransactionId?: string | null;
  reminderAt?: string | null;
  reminderStatus?: "pending" | "sent" | "dismissed" | null;
  isVirtual?: boolean;
  isPredicted?: boolean;
  isReconciled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AgendaDateRange {
  start: Date;
  end: Date;
}

export interface AgendaEventInput {
  title: string;
  description?: string | null;
  type: AgendaEventType;
  startsAt: string;
  endsAt?: string | null;
  allDay?: boolean;
  priority?: AgendaEventPriority;
  status?: Exclude<AgendaEventStatus, "overdue">;
  propertyId?: string | null;
  contractId?: string | null;
  amount?: number | null;
  cashflowDirection?: AgendaCashflowDirection | null;
  reminderMinutesBefore?: number | null;
}

export interface AgendaFilters {
  search?: string;
  type?: AgendaEventType | "all";
  source?: AgendaEventSource | "all";
  status?: AgendaEventStatus | "all";
  propertyId?: string | "all";
}

export interface AgendaSummary {
  todayCount: number;
  overdueCount: number;
  receivableAmount: number;
  payableAmount: number;
  predictedReceipts: number;
  internalReminders: number;
}
