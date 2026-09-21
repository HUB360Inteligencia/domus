import { describe, expect, it, vi, afterEach } from 'vitest';

// O hook importa a API, que carrega o client do Supabase (precisa de localStorage).
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { isInstallmentOverdue, summarizeSchedule } from './use-property-purchase-installments';
import type { PropertyPurchaseInstallment } from '@/types/property-purchase';

const makeInstallment = (
  overrides: Partial<PropertyPurchaseInstallment> & Pick<PropertyPurchaseInstallment, 'installment_number' | 'amount' | 'due_date'>
): PropertyPurchaseInstallment => ({
  id: `inst-${overrides.installment_number}`,
  property_id: 'prop-1',
  user_id: 'user-1',
  status: 'pending',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isInstallmentOverdue', () => {
  it('trata como vencida a parcela pendente com vencimento anterior a hoje', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 10, 14, 0, 0));

    expect(isInstallmentOverdue(makeInstallment({ installment_number: 1, amount: 100, due_date: '2026-05-09' }))).toBe(true);
    expect(isInstallmentOverdue(makeInstallment({ installment_number: 2, amount: 100, due_date: '2026-05-11' }))).toBe(false);
  });

  it('não considera vencida a parcela que vence hoje', () => {
    vi.useFakeTimers();
    // Fim do dia em UTC-3: um parse via UTC jogaria o vencimento para ontem.
    vi.setSystemTime(new Date(2026, 4, 10, 23, 30, 0));

    expect(isInstallmentOverdue(makeInstallment({ installment_number: 1, amount: 100, due_date: '2026-05-10' }))).toBe(false);
  });

  it('ignora parcelas pagas e canceladas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 10));

    expect(
      isInstallmentOverdue(makeInstallment({ installment_number: 1, amount: 100, due_date: '2026-01-01', status: 'paid' }))
    ).toBe(false);
    expect(
      isInstallmentOverdue(makeInstallment({ installment_number: 2, amount: 100, due_date: '2026-01-01', status: 'cancelled' }))
    ).toBe(false);
  });
});

describe('summarizeSchedule', () => {
  it('soma pago, em aberto e vencido, e aponta o próximo vencimento', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 10));

    const summary = summarizeSchedule([
      makeInstallment({ installment_number: 0, amount: 50000, due_date: '2026-01-10', status: 'paid', paid_date: '2026-01-10' }),
      makeInstallment({ installment_number: 1, amount: 1000, due_date: '2026-02-10', status: 'paid', paid_date: '2026-02-10' }),
      makeInstallment({ installment_number: 2, amount: 1000, due_date: '2026-04-10' }),
      makeInstallment({ installment_number: 3, amount: 1000, due_date: '2026-06-10' }),
      makeInstallment({ installment_number: 4, amount: 1000, due_date: '2026-07-10' }),
    ]);

    expect(summary.total).toBe(54000);
    expect(summary.paidAmount).toBe(51000);
    expect(summary.paidCount).toBe(2);
    expect(summary.pendingAmount).toBe(3000);
    expect(summary.pendingCount).toBe(3);
    expect(summary.overdueAmount).toBe(1000);
    expect(summary.overdueCount).toBe(1);
    // A vencida é a mais antiga em aberto, então é a próxima a resolver.
    expect(summary.nextDue?.installment_number).toBe(2);
  });

  it('exclui parcelas canceladas de todos os totais', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 10));

    const summary = summarizeSchedule([
      makeInstallment({ installment_number: 1, amount: 1000, due_date: '2026-06-10' }),
      makeInstallment({ installment_number: 2, amount: 9999, due_date: '2026-07-10', status: 'cancelled' }),
    ]);

    expect(summary.total).toBe(1000);
    expect(summary.pendingCount).toBe(1);
    expect(summary.nextDue?.installment_number).toBe(1);
  });

  it('devolve zeros e sem próximo vencimento para cronograma vazio', () => {
    const summary = summarizeSchedule([]);

    expect(summary.total).toBe(0);
    expect(summary.pendingCount).toBe(0);
    expect(summary.nextDue).toBeUndefined();
  });
});
