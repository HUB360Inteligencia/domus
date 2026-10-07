import { addDays, endOfDay, parseISO, startOfDay } from 'date-fns';
import type { AgendaEvent } from '@/types/agenda';

/**
 * Posição consolidada da carteira: quanto o patrimônio vale de fato (descontada a
 * dívida das compras) e o que entra e sai de caixa nos próximos dias.
 *
 * Valores por imóvel passam por `factorFor`, para a visão "minha cota" ratear
 * dívida, aluguel e contas pela mesma participação que já rateia o valor de mercado.
 */

export interface DebtRow {
  property_id: string;
  amount: number;
}

export interface PortfolioPosition {
  marketValue: number;
  outstandingDebt: number;
  pendingInstallments: number;
  netWorth: number;
  /** Fração do valor de mercado que já é patrimônio próprio (0–1). */
  equityRatio: number;
  windowDays: number;
  receivableUpcoming: number;
  payableUpcoming: number;
  upcomingCount: number;
  overdueReceivable: number;
  overduePayable: number;
  overdueCount: number;
  /** Contas pagas pelo inquilino aguardando confirmação (não entram em "a pagar"). */
  tenantConfirmations: number;
}

/** Item previsto ainda em aberto: aluguel a receber, parcela, conta do imóvel. */
const isOpenPrediction = (event: AgendaEvent) =>
  event.isPredicted === true && !event.isReconciled && event.status !== 'cancelled' && event.status !== 'completed';

export const computePortfolioPosition = ({
  marketValue,
  debts,
  events,
  factorFor,
  today = new Date(),
  windowDays = 30,
}: {
  marketValue: number;
  debts: DebtRow[];
  events: AgendaEvent[];
  factorFor: (propertyId?: string | null) => number;
  today?: Date;
  windowDays?: number;
}): PortfolioPosition => {
  const outstandingDebt = debts.reduce(
    (sum, row) => sum + (Number(row.amount) || 0) * factorFor(row.property_id),
    0
  );
  const netWorth = marketValue - outstandingDebt;

  const start = startOfDay(today);
  const end = endOfDay(addDays(start, windowDays));

  const position: PortfolioPosition = {
    marketValue,
    outstandingDebt,
    pendingInstallments: debts.length,
    netWorth,
    equityRatio: marketValue > 0 ? Math.min(Math.max(netWorth / marketValue, 0), 1) : 0,
    windowDays,
    receivableUpcoming: 0,
    payableUpcoming: 0,
    upcomingCount: 0,
    overdueReceivable: 0,
    overduePayable: 0,
    overdueCount: 0,
    tenantConfirmations: 0,
  };

  // O mesmo item pode chegar duas vezes se a janela da agenda se sobrepuser; conta uma.
  const seen = new Set<string>();

  for (const event of events) {
    if (!isOpenPrediction(event) || seen.has(event.id)) continue;
    seen.add(event.id);

    const date = parseISO(event.startsAt);
    const isOverdue = event.status === 'overdue' || date < start;
    if (!isOverdue && date > end) continue;

    if (event.settlement?.confirmOnly) {
      position.tenantConfirmations += 1;
      if (isOverdue) position.overdueCount += 1;
      continue;
    }

    const amount = (Number(event.amount) || 0) * factorFor(event.propertyId);

    if (isOverdue) {
      position.overdueCount += 1;
      if (event.cashflowDirection === 'receivable') position.overdueReceivable += amount;
      if (event.cashflowDirection === 'payable') position.overduePayable += amount;
      continue;
    }

    position.upcomingCount += 1;
    if (event.cashflowDirection === 'receivable') position.receivableUpcoming += amount;
    if (event.cashflowDirection === 'payable') position.payableUpcoming += amount;
  }

  return position;
};
