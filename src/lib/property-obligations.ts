import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnly, toDateOnlyString } from '@/lib/dates';
import {
  YEARLY_OBLIGATION_TYPES,
  type ObligationFrequency,
  type ObligationInput,
  type ObligationPlan,
  type ObligationSchedulePreviewItem,
  type ObligationsSummary,
  type ObligationType,
  type PropertyObligation,
  type PropertyObligationInstallment,
  type PropertyObligationWithInstallments,
} from '@/types/property-obligation';

/**
 * Regras das contas do imóvel que a tela precisa antes (ou além) do banco.
 *
 * A prévia do calendário espelha `generate_property_obligation_installments`
 * (migration 20261007000100): mesma soma de meses a partir do 1º vencimento,
 * mesma regra de valor (parcela informada, ou total / nº com a sobra do
 * arredondamento na última) e mesma janela de 12 meses para séries sem fim.
 */

const MONTHS_PER_STEP: Record<Exclude<ObligationFrequency, 'once'>, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

/** Janela gerada para séries sem fim — a varredura de avisos estende a cada acesso. */
export const RECURRING_WINDOW_MONTHS = 12;
const MAX_INSTALLMENTS = 600;

/**
 * Arredonda para centavos como o `round(x, 2)` do Postgres (meio para cima, em valores
 * positivos). `Math.round(x * 100)` erra nos meios: 350.005 * 100 = 35000.4999...,
 * e a prévia mostraria R$ 350,00 onde o banco gera R$ 350,01.
 */
export const roundCents = (value: number) => Number(`${Math.round(Number(`${value}e2`))}e-2`);

export const planOf = (obligation: Pick<ObligationInput, 'frequency' | 'installments_count'>): ObligationPlan => {
  if (obligation.frequency === 'once') return 'single';
  return obligation.installments_count ? 'installments' : 'recurring';
};

/** Vencimento n (1-based), sempre contado do primeiro: 31/01 → 28/02 → 31/03. */
export const dueDateOf = (firstDueDate: string, frequency: ObligationFrequency, n: number): string => {
  const first = parseDateOnly(firstDueDate);
  if (frequency === 'once' || n <= 1) return toDateOnlyString(first);
  return toDateOnlyString(addMonths(first, MONTHS_PER_STEP[frequency] * (n - 1)));
};

/**
 * Calendário que o banco vai gerar. Devolve [] quando falta valor ou data,
 * para o formulário mostrar a prévia só quando ela faz sentido.
 */
export const previewObligationSchedule = (
  input: Pick<
    ObligationInput,
    'frequency' | 'installments_count' | 'installment_amount' | 'total_amount' | 'first_due_date' | 'end_date'
  >,
  today: Date = new Date()
): ObligationSchedulePreviewItem[] => {
  if (!input.first_due_date) return [];

  const count = input.frequency === 'once' ? 1 : input.installments_count || null;
  const installmentAmount = Number(input.installment_amount) || 0;
  const totalAmount = Number(input.total_amount) || 0;

  let base: number;
  let last: number;

  if (count) {
    if (installmentAmount > 0) {
      base = installmentAmount;
      last = installmentAmount;
    } else if (totalAmount > 0) {
      base = roundCents(totalAmount / count);
      last = roundCents(totalAmount - base * (count - 1));
    } else {
      return [];
    }
  } else {
    if (installmentAmount <= 0) return [];
    base = installmentAmount;
    last = installmentAmount;
  }

  const windowEnd = toDateOnlyString(addMonths(today, RECURRING_WINDOW_MONTHS));
  const limit = input.end_date && input.end_date < windowEnd ? input.end_date : windowEnd;
  const items: ObligationSchedulePreviewItem[] = [];

  for (let n = 1; n <= MAX_INSTALLMENTS; n += 1) {
    if (count && n > count) break;
    const due = dueDateOf(input.first_due_date, input.frequency, n);
    if (!count && due > limit) break;
    items.push({ installment_number: n, amount: count && n === count ? last : base, due_date: due });
  }

  return items;
};

/** Vencida = em aberto com vencimento anterior a hoje (o status no banco não expira sozinho). */
export const isObligationInstallmentOverdue = (
  installment: Pick<PropertyObligationInstallment, 'status' | 'due_date'>,
  today: Date = new Date()
): boolean => installment.status === 'pending' && installment.due_date < toDateOnlyString(today);

/** Rótulo do vencimento: "3/10" numa série parcelada; o mês numa recorrente. */
export const installmentLabelOf = (
  installment: Pick<PropertyObligationInstallment, 'installment_number' | 'due_date'>,
  obligation: Pick<PropertyObligation, 'frequency' | 'installments_count'>
): string => {
  const plan = planOf(obligation);
  if (plan === 'single') return 'Única';
  if (plan === 'installments') return `${installment.installment_number}/${obligation.installments_count}`;
  // Série sem fim: o mês de referência identifica melhor que um número que só cresce.
  return format(parseDateOnly(installment.due_date), 'MMM/yyyy', { locale: ptBR });
};

export const summarizeObligations = (
  obligations: PropertyObligationWithInstallments[],
  today: Date = new Date()
): ObligationsSummary => {
  const todayKey = toDateOnlyString(today);
  const horizonKey = toDateOnlyString(addMonths(today, 12));
  const yearPrefix = todayKey.slice(0, 4);

  const summary: ObligationsSummary = {
    pendingAmount: 0,
    pendingCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
    next12MonthsAmount: 0,
    paidThisYearAmount: 0,
  };

  for (const obligation of obligations) {
    const ownerPays = obligation.paid_by === 'owner';

    for (const installment of obligation.installments) {
      if (installment.status === 'cancelled') continue;
      const amount = Number(installment.amount) || 0;

      if (installment.status === 'paid') {
        if (ownerPays && (installment.paid_date ?? installment.due_date).startsWith(yearPrefix)) {
          summary.paidThisYearAmount += Number(installment.paid_amount ?? amount) || 0;
        }
        continue;
      }

      if (ownerPays) {
        summary.pendingAmount += amount;
        summary.pendingCount += 1;
        if (installment.due_date >= todayKey && installment.due_date <= horizonKey) {
          summary.next12MonthsAmount += amount;
        }
      }

      if (installment.due_date < todayKey) {
        summary.overdueAmount += amount;
        summary.overdueCount += 1;
      }

      if (!summary.nextDue || installment.due_date < summary.nextDue.due_date) {
        summary.nextDue = { ...installment, obligation };
      }
    }
  }

  return summary;
};

const currentYearIn = (title: string, year?: number | null) =>
  year && title.includes(String(year)) ? String(year) : null;

/**
 * Dados da conta do próximo exercício: mesma estrutura, vencimentos um ano depois.
 * O título troca o ano quando ele aparece ("IPTU 2026" → "IPTU 2027").
 */
export const buildRenewalInput = (obligation: PropertyObligation): ObligationInput => {
  const nextYear = obligation.reference_year ? obligation.reference_year + 1 : null;
  const yearInTitle = currentYearIn(obligation.title, obligation.reference_year);

  return {
    obligation_type: obligation.obligation_type,
    title: yearInTitle && nextYear ? obligation.title.replace(yearInTitle, String(nextYear)) : obligation.title,
    reference_year: nextYear,
    frequency: obligation.frequency,
    installments_count: obligation.installments_count ?? null,
    installment_amount: obligation.installment_amount ?? null,
    total_amount: obligation.total_amount ?? null,
    first_due_date: toDateOnlyString(addMonths(parseDateOnly(obligation.first_due_date), 12)),
    end_date: obligation.end_date ? toDateOnlyString(addMonths(parseDateOnly(obligation.end_date), 12)) : null,
    paid_by: obligation.paid_by,
    reminder_days: obligation.reminder_days,
    status: 'active',
    creditor_name: obligation.creditor_name ?? null,
    reference_code: obligation.reference_code ?? null,
    notes: obligation.notes ?? null,
  };
};

/** Só faz sentido renovar o que tem fim: séries com nº fixo ou pagamento único. */
export const canRenew = (obligation: Pick<PropertyObligation, 'frequency' | 'installments_count'>): boolean =>
  planOf(obligation) !== 'recurring';

export const isYearlyType = (type: ObligationType): boolean => YEARLY_OBLIGATION_TYPES.includes(type);

/** Erros de preenchimento, na mesma ordem em que o formulário mostra os campos. */
export const validateObligationInput = (input: ObligationInput): string[] => {
  const errors: string[] = [];
  const plan = planOf(input);

  if (!input.title.trim()) errors.push('Informe a descrição da conta.');
  if (!input.first_due_date) errors.push('Informe o vencimento.');

  if (plan === 'installments') {
    const count = Number(input.installments_count) || 0;
    if (count < 1 || count > MAX_INSTALLMENTS) errors.push('Informe o número de parcelas (1 a 600).');
    if (!(Number(input.installment_amount) > 0) && !(Number(input.total_amount) > 0)) {
      errors.push('Informe o valor total ou o valor de cada parcela.');
    }
  } else if (plan === 'single') {
    if (!(Number(input.installment_amount) > 0) && !(Number(input.total_amount) > 0)) {
      errors.push('Informe o valor.');
    }
  } else if (!(Number(input.installment_amount) > 0)) {
    errors.push('Informe o valor de cada vencimento.');
  }

  if (input.end_date && input.first_due_date && input.end_date < input.first_due_date) {
    errors.push('A data final não pode ser anterior ao primeiro vencimento.');
  }

  if (input.reminder_days < 0 || input.reminder_days > 90) {
    errors.push('A antecedência do aviso deve ficar entre 0 e 90 dias.');
  }

  return errors;
};
