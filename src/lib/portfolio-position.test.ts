import { describe, expect, it } from 'vitest';
import { computePortfolioPosition } from './portfolio-position';
import type { AgendaEvent } from '@/types/agenda';

const TODAY = new Date(2026, 9, 7, 10, 0, 0); // 07/10/2026

const at = (day: string) => new Date(`${day}T12:00:00`).toISOString();

const event = (overrides: Partial<AgendaEvent> & Pick<AgendaEvent, 'id' | 'startsAt'>): AgendaEvent => ({
  source: 'financial',
  title: 'Item',
  type: 'payment',
  status: 'scheduled',
  priority: 'medium',
  allDay: true,
  isPredicted: true,
  isReconciled: false,
  ...overrides,
});

const gross = () => 1;

describe('computePortfolioPosition', () => {
  it('desconta o saldo devedor das compras do valor de mercado', () => {
    const position = computePortfolioPosition({
      marketValue: 1_000_000,
      debts: [
        { property_id: 'p-1', amount: 100_000 },
        { property_id: 'p-1', amount: 50_000 },
      ],
      events: [],
      factorFor: gross,
      today: TODAY,
    });

    expect(position.outstandingDebt).toBe(150_000);
    expect(position.netWorth).toBe(850_000);
    expect(position.equityRatio).toBeCloseTo(0.85);
    expect(position.pendingInstallments).toBe(2);
  });

  it('separa a receber, a pagar e atrasados, ignorando o que já foi baixado', () => {
    const position = computePortfolioPosition({
      marketValue: 500_000,
      debts: [],
      events: [
        event({ id: 'rent-1', startsAt: at('2026-10-10'), type: 'receipt', cashflowDirection: 'receivable', amount: 2500 }),
        event({ id: 'iptu-1', startsAt: at('2026-10-15'), cashflowDirection: 'payable', amount: 350 }),
        event({
          id: 'rent-late',
          startsAt: at('2026-09-10'),
          status: 'overdue',
          type: 'receipt',
          cashflowDirection: 'receivable',
          amount: 2500,
        }),
        event({ id: 'parcela-late', startsAt: at('2026-10-01'), status: 'overdue', cashflowDirection: 'payable', amount: 1000 }),
        // Já baixado: não entra.
        event({ id: 'paid', startsAt: at('2026-10-12'), cashflowDirection: 'payable', amount: 999, isReconciled: true }),
        // Fora da janela de 30 dias.
        event({ id: 'far', startsAt: at('2026-12-20'), cashflowDirection: 'payable', amount: 777 }),
        // Transação real (não prevista): não entra.
        event({ id: 'real', startsAt: at('2026-10-09'), cashflowDirection: 'payable', amount: 50, isPredicted: false }),
      ],
      factorFor: gross,
      today: TODAY,
    });

    expect(position.receivableUpcoming).toBe(2500);
    expect(position.payableUpcoming).toBe(350);
    expect(position.upcomingCount).toBe(2);
    expect(position.overdueReceivable).toBe(2500);
    expect(position.overduePayable).toBe(1000);
    expect(position.overdueCount).toBe(2);
  });

  it('conta à parte as contas pagas pelo inquilino', () => {
    const position = computePortfolioPosition({
      marketValue: 0,
      debts: [],
      events: [
        event({
          id: 'condo',
          startsAt: at('2026-10-10'),
          amount: 800,
          cashflowDirection: null,
          settlement: { kind: 'obligation_installment', id: 'x', confirmOnly: true },
        }),
      ],
      factorFor: gross,
      today: TODAY,
    });

    expect(position.payableUpcoming).toBe(0);
    expect(position.tenantConfirmations).toBe(1);
    expect(position.equityRatio).toBe(0);
  });

  it('rateia dívida e previstos pela cota de cada imóvel', () => {
    const factorFor = (propertyId?: string | null) => (propertyId === 'p-half' ? 0.5 : 1);

    const position = computePortfolioPosition({
      marketValue: 300_000,
      debts: [{ property_id: 'p-half', amount: 100_000 }],
      events: [
        event({
          id: 'rent',
          startsAt: at('2026-10-10'),
          propertyId: 'p-half',
          cashflowDirection: 'receivable',
          amount: 2000,
        }),
      ],
      factorFor,
      today: TODAY,
    });

    expect(position.outstandingDebt).toBe(50_000);
    expect(position.netWorth).toBe(250_000);
    expect(position.receivableUpcoming).toBe(1000);
  });

  it('não conta duas vezes o mesmo evento', () => {
    const duplicated = event({ id: 'dup', startsAt: at('2026-10-10'), cashflowDirection: 'payable', amount: 100 });
    const position = computePortfolioPosition({
      marketValue: 0,
      debts: [],
      events: [duplicated, duplicated],
      factorFor: gross,
      today: TODAY,
    });
    expect(position.payableUpcoming).toBe(100);
  });
});
