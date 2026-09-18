import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';

import { logger } from "@/lib/logger";
import { parseDateOnly, toDateOnlyString } from "@/lib/dates";

export interface PropertyFinancialMetrics {
  /** Resultado líquido médio mensal dos últimos 12 meses sobre o capital investido (%). */
  monthlyProfitability: number;
  /** Resultado líquido acumulado (todo o histórico) sobre o capital investido (%). */
  accumulatedROI: number;
  /** Percentual de dias sem contrato nos últimos 12 meses. */
  vacancyRate: number;
  /** Receita e despesa acumuladas (todo o histórico). */
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  /** Receita, despesa e resultado dos últimos 12 meses. */
  revenueLast12Months: number;
  expensesLast12Months: number;
  netIncomeLast12Months: number;
  /** Valor de compra + investimentos adicionais. */
  totalInvestment: number;
  /** Base usada nos percentuais: investimento total, ou valor de mercado quando não há custo cadastrado. */
  capitalBase: number;
}

export interface PropertyFinancialInputs {
  property: { purchase_value?: number | null; total_investment?: number | null; value?: number | null };
  transactions: Array<{ amount: number | null; transaction_type: string; transaction_date: string }>;
  investments: Array<{ amount: number | null }>;
  contracts: Array<{ start_date: string; end_date: string | null; status: string }>;
  now?: Date;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const sumBy = <T,>(items: T[], pick: (item: T) => number) =>
  items.reduce((sum, item) => sum + (Number(pick(item)) || 0), 0);

/**
 * Taxa de vacância dos últimos 12 meses, unindo os períodos de contrato para
 * não contar em dobro dias cobertos por contratos sobrepostos.
 */
export const calculateVacancyRate = (
  contracts: PropertyFinancialInputs['contracts'],
  now: Date = new Date(),
): number => {
  const windowStart = subMonths(now, 12);
  const totalDays = Math.max(1, Math.round((now.getTime() - windowStart.getTime()) / DAY_MS));

  const intervals = contracts
    .filter((contract) => contract.status !== 'cancelled' && contract.status !== 'canceled' && contract.status !== 'draft')
    .map((contract) => {
      const start = parseDateOnly(contract.start_date);
      const end = contract.end_date ? parseDateOnly(contract.end_date) : now;
      return [
        Math.max(start.getTime(), windowStart.getTime()),
        Math.min(end.getTime(), now.getTime()),
      ] as const;
    })
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start < end)
    .sort((a, b) => a[0] - b[0]);

  let occupiedMs = 0;
  let cursorStart = -1;
  let cursorEnd = -1;
  for (const [start, end] of intervals) {
    if (start > cursorEnd) {
      if (cursorEnd > cursorStart) occupiedMs += cursorEnd - cursorStart;
      cursorStart = start;
      cursorEnd = end;
    } else if (end > cursorEnd) {
      cursorEnd = end;
    }
  }
  if (cursorEnd > cursorStart) occupiedMs += cursorEnd - cursorStart;

  const occupiedDays = Math.min(totalDays, occupiedMs / DAY_MS);
  return Math.max(0, Math.min(100, ((totalDays - occupiedDays) / totalDays) * 100));
};

export const computePropertyFinancialMetrics = ({
  property,
  transactions,
  investments,
  contracts,
  now = new Date(),
}: PropertyFinancialInputs): PropertyFinancialMetrics => {
  const oneYearAgo = subMonths(now, 12);

  const income = transactions.filter((t) => t.transaction_type === 'income');
  const expenses = transactions.filter((t) => t.transaction_type === 'expense');
  const isRecent = (t: { transaction_date: string }) => {
    const date = parseDateOnly(t.transaction_date);
    return date >= oneYearAgo && date <= now;
  };

  const totalRevenue = sumBy(income, (t) => t.amount);
  const totalExpenses = sumBy(expenses, (t) => t.amount);
  const netIncome = totalRevenue - totalExpenses;

  const revenueLast12Months = sumBy(income.filter(isRecent), (t) => t.amount);
  const expensesLast12Months = sumBy(expenses.filter(isRecent), (t) => t.amount);
  const netIncomeLast12Months = revenueLast12Months - expensesLast12Months;

  const additionalInvestments = sumBy(investments, (inv) => inv.amount);
  const totalInvestment = Number(property.purchase_value || 0) + additionalInvestments;
  const capitalBase = totalInvestment > 0
    ? totalInvestment
    : Number(property.total_investment || property.value || 0);

  const monthlyProfitability = capitalBase > 0 ? (netIncomeLast12Months / 12 / capitalBase) * 100 : 0;
  const accumulatedROI = capitalBase > 0 ? (netIncome / capitalBase) * 100 : 0;
  const vacancyRate = contracts.length > 0 ? calculateVacancyRate(contracts, now) : 100;

  return {
    monthlyProfitability,
    accumulatedROI,
    vacancyRate,
    totalRevenue,
    totalExpenses,
    netIncome,
    revenueLast12Months,
    expensesLast12Months,
    netIncomeLast12Months,
    totalInvestment,
    capitalBase,
  };
};

export const fetchPropertyFinancialMetrics = async (propertyId: string): Promise<PropertyFinancialMetrics> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const [propertyResult, transactionsResult, investmentsResult, contractsResult] = await Promise.all([
      supabase
        .from('properties')
        .select('purchase_value, total_investment, value')
        .eq('id', propertyId)
        .single(),
      supabase
        .from('financial_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('property_id', propertyId),
      supabase
        .from('property_investments')
        .select('amount')
        .eq('property_id', propertyId),
      supabase
        .from('contracts')
        .select('start_date, end_date, status')
        .eq('property_id', propertyId),
    ]);

    if (propertyResult.error) throw propertyResult.error;
    if (transactionsResult.error) throw transactionsResult.error;
    if (investmentsResult.error) throw investmentsResult.error;
    if (contractsResult.error) throw contractsResult.error;

    return computePropertyFinancialMetrics({
      property: propertyResult.data,
      transactions: transactionsResult.data || [],
      investments: investmentsResult.data || [],
      contracts: contractsResult.data || [],
    });
  } catch (error) {
    logger.error('Error fetching property financial metrics:', error);
    throw error;
  }
};

export const fetchActiveContractForProperty = async (propertyId: string) => {
  try {
    const now = toDateOnlyString(new Date());

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .maybeSingle();

    if (error) throw error;
    return contract;
  } catch (error) {
    logger.error('Error fetching active contract:', error);
    return null;
  }
};
