import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import { fetchAgendaEvents } from '@/api/agenda';
import { fetchOutstandingPurchaseInstallments } from '@/api/property-purchase-installments';
import { useOwnershipView } from '@/contexts/OwnershipViewContext';
import { computePortfolioPosition } from '@/lib/portfolio-position';

const WINDOW_DAYS = 30;
/** Atrasos mais antigos que isso são histórico, não pendência — mesmo corte dos avisos. */
const OVERDUE_LOOKBACK_DAYS = 60;

/**
 * Patrimônio líquido e caixa previsto, já na visão escolhida (bruto ou minha cota).
 *
 * Reaproveita a Agenda como fonte dos previstos: ela já concilia aluguel recebido
 * à mão, parcelas da compra e contas do imóvel, então o painel e a agenda nunca
 * discordam sobre o que está em aberto.
 */
export const usePortfolioPosition = (
  /** Valor de mercado da carteira já na visão corrente (o de `useDashboardMetrics`). */
  marketValue: number
) => {
  const { factorFor, mode } = useOwnershipView();

  const range = useMemo(() => {
    const today = startOfDay(new Date());
    return { start: subDays(today, OVERDUE_LOOKBACK_DAYS), end: endOfDay(addDays(today, WINDOW_DAYS)) };
  }, []);

  const debtQuery = useQuery({
    queryKey: ['portfolio-position', 'purchase-debt'],
    queryFn: fetchOutstandingPurchaseInstallments,
    staleTime: 2 * 60 * 1000,
  });

  const eventsQuery = useQuery({
    // Prefixo "agenda-events": as baixas e mudanças financeiras já invalidam esta consulta.
    queryKey: ['agenda-events', 'portfolio-position', range.start.toISOString(), range.end.toISOString()],
    queryFn: () => fetchAgendaEvents(range),
    staleTime: 2 * 60 * 1000,
  });

  const position = useMemo(
    () =>
      computePortfolioPosition({
        marketValue,
        debts: debtQuery.data ?? [],
        events: eventsQuery.data ?? [],
        factorFor,
        windowDays: WINDOW_DAYS,
      }),
    [marketValue, debtQuery.data, eventsQuery.data, factorFor]
  );

  return {
    position,
    mode,
    isLoading: debtQuery.isLoading || eventsQuery.isLoading,
    hasError: !!debtQuery.error || !!eventsQuery.error,
  };
};
