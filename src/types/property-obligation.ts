/**
 * Contas do imóvel: IPTU, condomínio, seguro, ITR, taxa de lixo...
 *
 * A definição vive em `property_obligations` e o calendário em
 * `property_obligation_installments`, gerado pelo RPC
 * `generate_property_obligation_installments`. A baixa de uma conta paga pelo
 * proprietário cria despesa em `financial_transactions`; a de uma conta paga pelo
 * inquilino só confirma o pagamento. Regras puras em `src/lib/property-obligations.ts`.
 */

export type ObligationType = 'iptu' | 'condo' | 'insurance' | 'itr' | 'waste_fee' | 'utility' | 'other';

export type ObligationFrequency = 'once' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';

export type ObligationPaidBy = 'owner' | 'tenant';

export type ObligationStatus = 'active' | 'paused' | 'closed';

export type ObligationInstallmentStatus = 'pending' | 'paid' | 'cancelled';

/**
 * Forma da série, como o usuário pensa nela. No banco vira frequency + installments_count:
 * único = 'once'; parcelado = nº fixo; recorrente = sem nº (gerado em janela móvel).
 */
export type ObligationPlan = 'single' | 'installments' | 'recurring';

export const OBLIGATION_TYPE_LABELS: Record<ObligationType, string> = {
  iptu: 'IPTU',
  condo: 'Condomínio',
  insurance: 'Seguro',
  itr: 'ITR',
  waste_fee: 'Taxa de lixo',
  utility: 'Contas de consumo',
  other: 'Outra conta',
};

export const OBLIGATION_FREQUENCY_LABELS: Record<Exclude<ObligationFrequency, 'once'>, string> = {
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export const OBLIGATION_PLAN_LABELS: Record<ObligationPlan, string> = {
  single: 'Pagamento único',
  installments: 'Parcelado',
  recurring: 'Recorrente',
};

export const OBLIGATION_PAID_BY_LABELS: Record<ObligationPaidBy, string> = {
  owner: 'Proprietário',
  tenant: 'Inquilino',
};

export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  closed: 'Encerrada',
};

/** Tipos com exercício anual (o título leva o ano e a conta se renova a cada ano). */
export const YEARLY_OBLIGATION_TYPES: ObligationType[] = ['iptu', 'itr', 'waste_fee'];

export interface PropertyObligation {
  id: string;
  user_id: string;
  client_id?: string | null;
  property_id: string;
  obligation_type: ObligationType;
  title: string;
  reference_year?: number | null;
  frequency: ObligationFrequency;
  installments_count?: number | null;
  installment_amount?: number | null;
  total_amount?: number | null;
  first_due_date: string;
  end_date?: string | null;
  paid_by: ObligationPaidBy;
  reminder_days: number;
  status: ObligationStatus;
  creditor_name?: string | null;
  reference_code?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyObligationInstallment {
  id: string;
  obligation_id: string;
  property_id: string;
  user_id: string;
  client_id?: string | null;
  financial_transaction_id?: string | null;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  paid_amount?: number | null;
  status: ObligationInstallmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyObligationWithInstallments extends PropertyObligation {
  installments: PropertyObligationInstallment[];
}

/** Campos editáveis de uma conta (o que o formulário grava). */
export interface ObligationInput {
  obligation_type: ObligationType;
  title: string;
  reference_year?: number | null;
  frequency: ObligationFrequency;
  installments_count?: number | null;
  installment_amount?: number | null;
  total_amount?: number | null;
  first_due_date: string;
  end_date?: string | null;
  paid_by: ObligationPaidBy;
  reminder_days: number;
  status?: ObligationStatus;
  creditor_name?: string | null;
  reference_code?: string | null;
  notes?: string | null;
}

export interface ObligationSchedulePreviewItem {
  installment_number: number;
  amount: number;
  due_date: string;
}

export interface ObligationsSummary {
  /** Em aberto, a pagar pelo proprietário. */
  pendingAmount: number;
  pendingCount: number;
  /** Vencido e não baixado (inclui os do inquilino, que pedem confirmação). */
  overdueAmount: number;
  overdueCount: number;
  /** Custo previsto do proprietário nos próximos 12 meses. */
  next12MonthsAmount: number;
  /** Pago pelo proprietário no ano corrente. */
  paidThisYearAmount: number;
  nextDue?: PropertyObligationInstallment & { obligation: PropertyObligation };
}

/** Normaliza os textos validados por CHECK no banco para as unions da aplicação. */
export const toPropertyObligation = (row: Record<string, unknown>): PropertyObligation => ({
  ...(row as unknown as PropertyObligation),
  installments_count: row.installments_count == null ? null : Number(row.installments_count),
  installment_amount: row.installment_amount == null ? null : Number(row.installment_amount),
  total_amount: row.total_amount == null ? null : Number(row.total_amount),
  reminder_days: Number(row.reminder_days ?? 5),
});

export const toObligationInstallment = (row: Record<string, unknown>): PropertyObligationInstallment => ({
  ...(row as unknown as PropertyObligationInstallment),
  amount: Number(row.amount ?? 0),
  paid_amount: row.paid_amount == null ? null : Number(row.paid_amount),
});
