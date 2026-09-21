/**
 * Condição de compra do imóvel e parcelas da aquisição.
 *
 * O cronograma de parcelas vive em `property_purchase_installments` e é gerado
 * pelo RPC `generate_property_purchase_installments` a partir dos campos de
 * condição gravados no próprio imóvel. Cada baixa cria uma despesa real em
 * `financial_transactions`, no mesmo molde das parcelas de aluguel.
 */

export type PaymentType =
  | 'cash'
  | 'installments'
  | 'financed'
  | 'barter'
  | 'consortium'
  | 'mixed';

export type InstallmentFrequency =
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

export type PurchaseIndex = 'none' | 'igpm' | 'incc' | 'ipca' | 'cdi' | 'tr';

export type PurchaseInstallmentStatus = 'pending' | 'paid' | 'cancelled';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash: 'À vista',
  installments: 'Parcelado direto',
  financed: 'Financiado',
  barter: 'Permuta',
  consortium: 'Consórcio',
  mixed: 'Misto',
};

export const INSTALLMENT_FREQUENCY_LABELS: Record<InstallmentFrequency, string> = {
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export const PURCHASE_INDEX_LABELS: Record<PurchaseIndex, string> = {
  none: 'Sem correção',
  igpm: 'IGP-M',
  incc: 'INCC',
  ipca: 'IPCA',
  cdi: 'CDI',
  tr: 'TR',
};

/** Formas de compra que geram cronograma de parcelas. */
export const PAYMENT_TYPES_WITH_SCHEDULE: PaymentType[] = [
  'installments',
  'financed',
  'consortium',
  'mixed',
];

export const hasInstallmentSchedule = (paymentType?: string | null): boolean =>
  !!paymentType && PAYMENT_TYPES_WITH_SCHEDULE.includes(paymentType as PaymentType);

/** Condição de pagamento gravada nas colunas de `properties`. */
export interface PropertyPurchaseTerms {
  payment_type?: PaymentType | null;
  down_payment?: number | null;
  installments_count?: number | null;
  installment_amount?: number | null;
  installment_frequency?: InstallmentFrequency | null;
  first_installment_date?: string | null;
  creditor_name?: string | null;
  purchase_index?: PurchaseIndex | null;
  purchase_notes?: string | null;
}

export interface PropertyPurchaseInstallment {
  id: string;
  property_id: string;
  user_id: string;
  client_id?: string | null;
  financial_transaction_id?: string | null;
  /** 0 = entrada/sinal; 1..n = parcelas. */
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  status: PurchaseInstallmentStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseScheduleSummary {
  total: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  nextDue?: PropertyPurchaseInstallment;
}

/** Rótulo da parcela: a número 0 é a entrada. */
export const installmentLabel = (installment: PropertyPurchaseInstallment, total?: number): string => {
  if (installment.installment_number === 0) return 'Entrada';
  return total ? `${installment.installment_number}/${total}` : `Parcela ${installment.installment_number}`;
};

export interface NormalizedPurchaseTerms {
  payment_type: PaymentType | null;
  installment_frequency: InstallmentFrequency | null;
  purchase_index: PurchaseIndex | null;
}

/**
 * Normaliza as colunas de condição de compra vindas do banco.
 *
 * No Postgres são `text` (validados por CHECK); na aplicação são unions. Os
 * mapeadores de `src/api/properties.ts` espalham este resultado para não repetir
 * o cast em cada campo.
 */
export const toPurchaseTerms = (row: {
  payment_type?: string | null;
  installment_frequency?: string | null;
  purchase_index?: string | null;
}): NormalizedPurchaseTerms => ({
  payment_type: (row.payment_type as PaymentType | null) ?? null,
  installment_frequency: (row.installment_frequency as InstallmentFrequency | null) ?? null,
  purchase_index: (row.purchase_index as PurchaseIndex | null) ?? null,
});
