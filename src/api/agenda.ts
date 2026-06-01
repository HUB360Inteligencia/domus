import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  lastDayOfMonth,
  max,
  min,
  parseISO,
  startOfMonth,
} from "date-fns";

import { getCurrentUserClientId } from "@/api/client-users";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  AgendaDateRange,
  AgendaEvent,
  AgendaEventInput,
  AgendaEventPriority,
  AgendaEventStatus,
  AgendaEventType,
} from "@/types/agenda";

type AgendaEventRow = Tables<"agenda_events"> & {
  property?: { title?: string | null } | null;
  contract?: { title?: string | null } | null;
};

type ReminderRow = Pick<Tables<"agenda_reminders">, "id" | "event_id" | "remind_at" | "status">;

type ContractScheduleRow = {
  id: string;
  title: string;
  property_id: string | null;
  tenant_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  value: number;
  payment_day: number;
  payment_due_day: number | null;
  adjustment_date: string | null;
  property?: {
    title?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
};

type ActivityScheduleRow = {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  property_id: string | null;
  contract_id: string | null;
  property?: { title?: string | null } | null;
};

type FinancialScheduleRow = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  transaction_type: "income" | "expense" | string;
  transaction_date: string;
  property_id: string | null;
  recurring: boolean | null;
  property?: { title?: string | null } | null;
};

type ExpectedPaymentRow = Tables<"contract_expected_payments"> & {
  contract?: {
    title?: string | null;
    tenant_name?: string | null;
  } | null;
  property?: { title?: string | null } | null;
};

type QueryError = { code?: string; message: string };

const isMissingSchemaError = (error: QueryError | null | undefined) => {
  return error?.code === "PGRST202" || error?.code === "PGRST204" || error?.code === "PGRST205";
};

const isDoneStatus = (status: AgendaEventStatus) => status === "completed" || status === "cancelled";

const withOverdue = (status: AgendaEventStatus, startsAt: string): AgendaEventStatus => {
  if (isDoneStatus(status)) return status;
  return isBefore(parseISO(startsAt), new Date()) ? "overdue" : status;
};

const normalizeStatus = (status: string): AgendaEventStatus => {
  if (status === "completed" || status === "cancelled" || status === "in_progress") return status;
  return "scheduled";
};

const normalizePriority = (priority: string | null | undefined): AgendaEventPriority => {
  if (priority === "low" || priority === "high") return priority;
  return "medium";
};

const normalizeActivityType = (type: string): AgendaEventType => {
  if (type === "maintenance" || type === "inspection" || type === "document") return type;
  if (type === "financial") return "payment";
  if (type === "legal") return "contract";
  return "task";
};

const dateAtNoon = (date: string | Date) => {
  const value = typeof date === "string" ? parseISO(date) : date;
  const copy = new Date(value);
  copy.setHours(12, 0, 0, 0);
  return copy;
};

const isWithinRange = (date: Date, range: AgendaDateRange) => {
  return !isBefore(date, range.start) && !isAfter(date, range.end);
};

const sameMonthReceipt = (transaction: FinancialScheduleRow, contract: ContractScheduleRow, dueDate: Date) => {
  if (transaction.transaction_type !== "income") return false;
  if (contract.property_id && transaction.property_id !== contract.property_id) return false;
  if (!isSameMonth(parseISO(transaction.transaction_date), dueDate)) return false;
  return Math.abs(Number(transaction.amount) - Number(contract.value)) < 0.02;
};

const mapManualEvent = (
  event: AgendaEventRow,
  reminders: ReminderRow[],
  propertyTitle?: string | null,
  contractTitle?: string | null,
): AgendaEvent => {
  const reminder = reminders.find((item) => item.event_id === event.id);
  const status = withOverdue(normalizeStatus(event.status), event.starts_at);

  return {
    id: event.id,
    source: event.source as AgendaEvent["source"],
    sourceId: event.id,
    title: event.title,
    description: event.description,
    type: event.event_type as AgendaEventType,
    status,
    priority: normalizePriority(event.priority),
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    allDay: event.all_day,
    amount: event.amount,
    cashflowDirection: event.cashflow_direction as AgendaEvent["cashflowDirection"],
    propertyId: event.property_id,
    propertyTitle,
    contractId: event.contract_id,
    contractTitle,
    reminderAt: reminder?.remind_at ?? null,
    reminderStatus: (reminder?.status as AgendaEvent["reminderStatus"]) ?? null,
    metadata: event.metadata ?? {},
  };
};

const mapActivityEvent = (activity: ActivityScheduleRow): AgendaEvent | null => {
  const date = activity.due_date || activity.start_date;
  if (!date) return null;

  const startsAt = dateAtNoon(date).toISOString();
  const status = withOverdue(normalizeStatus(activity.status), startsAt);
  const amount = activity.actual_cost ?? activity.estimated_cost;

  return {
    id: `activity-${activity.id}`,
    source: "activity",
    sourceId: activity.id,
    title: activity.title,
    description: activity.description,
    type: normalizeActivityType(activity.activity_type),
    status,
    priority: normalizePriority(activity.priority),
    startsAt,
    allDay: true,
    amount,
    cashflowDirection: amount ? "payable" : null,
    propertyId: activity.property_id,
    propertyTitle: activity.property?.title ?? null,
    contractId: activity.contract_id,
    isVirtual: true,
    metadata: {
      activityType: activity.activity_type,
    },
  };
};

const mapFinancialEvent = (transaction: FinancialScheduleRow): AgendaEvent => {
  const isIncome = transaction.transaction_type === "income";

  return {
    id: `financial-${transaction.id}`,
    source: "financial",
    sourceId: transaction.id,
    title: transaction.name,
    description: transaction.description,
    type: isIncome ? "receipt" : "payment",
    status: "completed",
    priority: "medium",
    startsAt: dateAtNoon(transaction.transaction_date).toISOString(),
    allDay: true,
    amount: Number(transaction.amount),
    cashflowDirection: isIncome ? "receivable" : "payable",
    propertyId: transaction.property_id,
    propertyTitle: transaction.property?.title ?? null,
    isVirtual: true,
    metadata: {
      recurring: transaction.recurring,
    },
  };
};

const buildContractDueDate = (monthDate: Date, paymentDay: number) => {
  const lastDay = lastDayOfMonth(monthDate).getDate();
  return dateAtNoon(new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.min(paymentDay, lastDay)));
};

const buildFallbackContractReceiptEvents = (
  contracts: ContractScheduleRow[],
  transactions: FinancialScheduleRow[],
  range: AgendaDateRange,
): AgendaEvent[] => {
  const events: AgendaEvent[] = [];

  contracts
    .filter((contract) => contract.status === "active")
    .forEach((contract) => {
      const contractStart = startOfMonth(parseISO(contract.start_date));
      const contractEnd = endOfMonth(parseISO(contract.end_date));
      const firstMonth = max([startOfMonth(range.start), contractStart]);
      const lastMonth = min([startOfMonth(range.end), contractEnd]);
      const paymentDay = contract.payment_due_day ?? contract.payment_day;

      for (let cursor = firstMonth; !isAfter(cursor, lastMonth); cursor = addMonths(cursor, 1)) {
        const dueDate = buildContractDueDate(cursor, paymentDay);
        if (!isWithinRange(dueDate, range)) continue;

        const reconciled = transactions.some((transaction) => sameMonthReceipt(transaction, contract, dueDate));
        const startsAt = dueDate.toISOString();
        const period = format(dueDate, "yyyy-MM");

        events.push({
          id: `contract-receipt-${contract.id}-${period}`,
          source: "contract",
          sourceId: contract.id,
          title: `Recebimento previsto - ${contract.property?.title || contract.title}`,
          description: contract.tenant_name ? `Locatario: ${contract.tenant_name}` : "Recebimento previsto do contrato ativo.",
          type: "receipt",
          status: reconciled ? "completed" : withOverdue("scheduled", startsAt),
          priority: reconciled ? "low" : "high",
          startsAt,
          allDay: true,
          amount: Number(contract.value),
          cashflowDirection: "receivable",
          propertyId: contract.property_id,
          propertyTitle: contract.property?.title ?? null,
          contractId: contract.id,
          contractTitle: contract.title,
          tenantName: contract.tenant_name,
          isVirtual: true,
          isPredicted: true,
          isReconciled: reconciled,
          metadata: {
            period,
            paymentDay,
            source: "contract_schedule",
          },
        });
      }

      const endDate = dateAtNoon(contract.end_date);
      if (isWithinRange(endDate, range)) {
        events.push({
          id: `contract-end-${contract.id}`,
          source: "contract",
          sourceId: contract.id,
          title: `Vencimento de locacao - ${contract.property?.title || contract.title}`,
          description: contract.tenant_name ? `Contrato com ${contract.tenant_name}` : "Contrato ativo proximo ao vencimento.",
          type: "contract",
          status: withOverdue("scheduled", endDate.toISOString()),
          priority: "high",
          startsAt: endDate.toISOString(),
          allDay: true,
          propertyId: contract.property_id,
          propertyTitle: contract.property?.title ?? null,
          contractId: contract.id,
          contractTitle: contract.title,
          tenantName: contract.tenant_name,
          isVirtual: true,
        });
      }
    });

  return events;
};

const mapExpectedPaymentEvent = (
  payment: ExpectedPaymentRow,
  transactions: FinancialScheduleRow[],
): AgendaEvent => {
  const dueDate = dateAtNoon(payment.expected_due_date);
  const reconciled =
    payment.status === "paid" ||
    transactions.some((transaction) => {
      if (transaction.transaction_type !== "income") return false;
      if (payment.property_id && transaction.property_id !== payment.property_id) return false;
      return isSameMonth(parseISO(transaction.transaction_date), dueDate) &&
        Math.abs(Number(transaction.amount) - Number(payment.amount)) < 0.02;
    });

  const startsAt = dueDate.toISOString();

  return {
    id: `expected-payment-${payment.id}`,
    source: "contract",
    sourceId: payment.id,
    title: `Recebimento previsto - ${payment.property?.title || payment.contract?.title || "Contrato"}`,
    description: payment.contract?.tenant_name
      ? `Locatario: ${payment.contract.tenant_name}`
      : "Recebimento previsto do contrato ativo.",
    type: "receipt",
    status: reconciled ? "completed" : withOverdue("scheduled", startsAt),
    priority: reconciled ? "low" : "high",
    startsAt,
    allDay: true,
    amount: Number(payment.amount),
    cashflowDirection: "receivable",
    propertyId: payment.property_id,
    propertyTitle: payment.property?.title ?? null,
    contractId: payment.contract_id,
    contractTitle: payment.contract?.title ?? null,
    tenantName: payment.contract?.tenant_name ?? null,
    expectedPaymentId: payment.id,
    financialTransactionId: payment.financial_transaction_id,
    isVirtual: true,
    isPredicted: true,
    isReconciled: reconciled,
    metadata: {
      expectedPaymentId: payment.id,
      period: payment.reference_month.slice(0, 7),
      source: payment.source,
    },
  };
};

const buildContractEndEvents = (contracts: ContractScheduleRow[], range: AgendaDateRange): AgendaEvent[] => {
  return contracts.flatMap((contract) => {
    const endDate = dateAtNoon(contract.end_date);
    if (!isWithinRange(endDate, range)) return [];

    return [{
      id: `contract-end-${contract.id}`,
      source: "contract" as const,
      sourceId: contract.id,
      title: `Vencimento de locacao - ${contract.property?.title || contract.title}`,
      description: contract.tenant_name ? `Contrato com ${contract.tenant_name}` : "Contrato ativo proximo ao vencimento.",
      type: "contract" as const,
      status: withOverdue("scheduled", endDate.toISOString()),
      priority: "high" as const,
      startsAt: endDate.toISOString(),
      allDay: true,
      propertyId: contract.property_id,
      propertyTitle: contract.property?.title ?? null,
      contractId: contract.id,
      contractTitle: contract.title,
      tenantName: contract.tenant_name,
      isVirtual: true,
    }];
  });
};

async function generateExpectedPayments(range: AgendaDateRange) {
  const { error } = await supabase.rpc("generate_contract_expected_payments", {
    p_from_month: format(startOfMonth(range.start), "yyyy-MM-dd"),
    p_through_month: format(startOfMonth(range.end), "yyyy-MM-dd"),
  });

  if (error && !isMissingSchemaError(error)) {
    logger.error("Error generating expected contract payments:", error);
  }
}

export async function processDueAgendaReminders(): Promise<number> {
  const { data, error } = await supabase.rpc("process_due_agenda_reminders");

  if (error) {
    if (!isMissingSchemaError(error)) {
      logger.error("Error processing agenda reminders:", error);
    }
    return 0;
  }

  return data ?? 0;
}

export async function recordExpectedContractPayment(expectedPaymentId: string): Promise<string> {
  const { data, error } = await supabase.rpc("record_expected_contract_payment", {
    p_expected_payment_id: expectedPaymentId,
    p_paid_date: format(new Date(), "yyyy-MM-dd"),
    p_payment_method: null,
  });

  if (error) {
    logger.error("Error recording expected contract payment:", error);

    if (isMissingSchemaError(error)) {
      throw new Error("A migration da Agenda ainda nao foi aplicada ao banco.");
    }

    throw new Error(error.message);
  }

  return data;
}

export async function fetchAgendaEvents(range: AgendaDateRange): Promise<AgendaEvent[]> {
  const startIso = range.start.toISOString();
  const endIso = range.end.toISOString();

  await generateExpectedPayments(range);

  const [manual, reminders, activities, contracts, expectedPayments, transactions] = await Promise.all([
    supabase
      .from("agenda_events")
      .select("*,property:properties(title),contract:contracts(title)")
      .gte("starts_at", startIso)
      .lte("starts_at", endIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("agenda_reminders")
      .select("id,event_id,remind_at,status")
      .gte("remind_at", startIso)
      .lte("remind_at", endIso),
    supabase
      .from("activities")
      .select("id,title,description,activity_type,status,priority,start_date,due_date,estimated_cost,actual_cost,property_id,contract_id,property:properties(title)"),
    supabase
      .from("contracts")
      .select("id,title,property_id,tenant_name,start_date,end_date,status,value,payment_day,payment_due_day,adjustment_date,property:properties(title,address,city,state)")
      .eq("status", "active")
      .lte("start_date", format(range.end, "yyyy-MM-dd"))
      .gte("end_date", format(range.start, "yyyy-MM-dd")),
    supabase
      .from("contract_expected_payments")
      .select("*,contract:contracts(title,tenant_name),property:properties(title)")
      .gte("expected_due_date", format(range.start, "yyyy-MM-dd"))
      .lte("expected_due_date", format(range.end, "yyyy-MM-dd"))
      .order("expected_due_date", { ascending: true }),
    supabase
      .from("financial_transactions")
      .select("id,name,description,amount,transaction_type,transaction_date,property_id,recurring,property:properties(title)")
      .gte("transaction_date", format(range.start, "yyyy-MM-dd"))
      .lte("transaction_date", format(range.end, "yyyy-MM-dd")),
  ]);

  const errors = [
    { source: 'manual', err: manual.error },
    { source: 'reminders', err: reminders.error },
    { source: 'activities', err: activities.error },
    { source: 'contracts', err: contracts.error },
    { source: 'expectedPayments', err: expectedPayments.error },
    { source: 'transactions', err: transactions.error }
  ].filter(e => e.err);

  const criticalErrors = errors.filter(e => {
    // Ignore PGRST205 (table does not exist) for agenda_events and reminders as they might not be migrated yet
    if (isMissingSchemaError(e.err) && (e.source === 'manual' || e.source === 'reminders' || e.source === 'expectedPayments')) {
      return false;
    }
    return true;
  });

  if (criticalErrors.length) {
    logger.error("Error fetching agenda events:", criticalErrors);
    throw new Error(criticalErrors[0].err!.message);
  }

  const remindersData = (reminders.data || []) as ReminderRow[];
  const activitiesData = ((activities.data || []) as ActivityScheduleRow[])
    .map(mapActivityEvent)
    .filter((event) => event && isWithinRange(parseISO(event.startsAt), range))
    .filter(Boolean) as AgendaEvent[];

  const transactionsData = ((transactions.data || []) as FinancialScheduleRow[]).map(mapFinancialEvent);
  const contractRows = (contracts.data || []) as unknown as ContractScheduleRow[];
  const transactionRows = (transactions.data || []) as unknown as FinancialScheduleRow[];
  const expectedRows = (expectedPayments.data || []) as unknown as ExpectedPaymentRow[];
  const expectedReceiptEvents = expectedRows.map((payment) => mapExpectedPaymentEvent(payment, transactionRows));
  const contractReceiptEvents = expectedReceiptEvents.length > 0
    ? expectedReceiptEvents
    : buildFallbackContractReceiptEvents(contractRows, transactionRows, range);
  const contractsData = [...contractReceiptEvents, ...buildContractEndEvents(contractRows, range)];

  const propertyTitles = new Map<string, string>();
  const contractTitles = new Map<string, string>();

  [...activitiesData, ...transactionsData, ...contractsData].forEach((event) => {
    if (event.propertyId && event.propertyTitle) propertyTitles.set(event.propertyId, event.propertyTitle);
    if (event.contractId && event.contractTitle) contractTitles.set(event.contractId, event.contractTitle);
  });

  const manualData = ((manual.data || []) as unknown as AgendaEventRow[]).map((event) =>
    mapManualEvent(
      event,
      remindersData,
      event.property?.title ?? (event.property_id ? propertyTitles.get(event.property_id) : null),
      event.contract?.title ?? (event.contract_id ? contractTitles.get(event.contract_id) : null),
    ),
  );

  return [...manualData, ...activitiesData, ...transactionsData, ...contractsData].sort(
    (a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime(),
  );
}

export async function createAgendaEvent(input: AgendaEventInput): Promise<AgendaEvent> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Usuario nao autenticado");

  const clientId = await getCurrentUserClientId();
  const startsAt = parseISO(input.startsAt);

  const { data, error } = await supabase
    .from("agenda_events")
    .insert({
      user_id: userData.user.id,
      client_id: clientId,
      title: input.title,
      description: input.description || null,
      event_type: input.type,
      source: "manual",
      status: input.status || "scheduled",
      priority: input.priority || "medium",
      starts_at: startsAt.toISOString(),
      ends_at: input.endsAt ? parseISO(input.endsAt).toISOString() : null,
      all_day: input.allDay ?? true,
      property_id: input.propertyId || null,
      contract_id: input.contractId || null,
      amount: input.amount ?? null,
      cashflow_direction: input.cashflowDirection || null,
      metadata: {},
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Error creating agenda event:", error);
    throw new Error(error.message);
  }

  let reminder: ReminderRow | null = null;
  if (input.reminderMinutesBefore != null) {
    const remindAt = new Date(startsAt.getTime() - input.reminderMinutesBefore * 60 * 1000);
    const { data: reminderData, error: reminderError } = await supabase
      .from("agenda_reminders")
      .insert({
        event_id: data.id,
        user_id: userData.user.id,
        remind_at: reminderAt.toISOString(),
        offset_minutes: input.reminderMinutesBefore,
        channel: "in_app",
      })
      .select("id,event_id,remind_at,status")
      .single();

    if (reminderError) {
      logger.error("Error creating agenda reminder:", reminderError);
      throw new Error(reminderError.message);
    }

    reminder = reminderData as ReminderRow;
  }

  return mapManualEvent(data as AgendaEventRow, reminder ? [reminder] : []);
}
