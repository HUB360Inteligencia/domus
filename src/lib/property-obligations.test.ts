import { describe, expect, it } from 'vitest';
import {
  buildRenewalInput,
  canRenew,
  dueDateOf,
  installmentLabelOf,
  isObligationInstallmentOverdue,
  planOf,
  previewObligationSchedule,
  summarizeObligations,
  validateObligationInput,
} from './property-obligations';
import type {
  ObligationInput,
  PropertyObligation,
  PropertyObligationInstallment,
  PropertyObligationWithInstallments,
} from '@/types/property-obligation';

const TODAY = new Date(2026, 9, 7, 15, 0, 0); // 07/10/2026

const obligation = (overrides: Partial<PropertyObligation> = {}): PropertyObligation => ({
  id: 'ob-1',
  user_id: 'user-1',
  property_id: 'prop-1',
  obligation_type: 'iptu',
  title: 'IPTU 2026',
  reference_year: 2026,
  frequency: 'monthly',
  installments_count: 10,
  installment_amount: null,
  total_amount: 3500,
  first_due_date: '2026-02-10',
  end_date: null,
  paid_by: 'owner',
  reminder_days: 5,
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

let seq = 0;
const installment = (
  overrides: Partial<PropertyObligationInstallment> & Pick<PropertyObligationInstallment, 'due_date'>
): PropertyObligationInstallment => ({
  id: `inst-${(seq += 1)}`,
  obligation_id: 'ob-1',
  property_id: 'prop-1',
  user_id: 'user-1',
  installment_number: seq,
  amount: 350,
  status: 'pending',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const input = (overrides: Partial<ObligationInput> = {}): ObligationInput => ({
  obligation_type: 'iptu',
  title: 'IPTU 2027',
  reference_year: 2027,
  frequency: 'monthly',
  installments_count: 10,
  installment_amount: null,
  total_amount: 3500,
  first_due_date: '2027-02-10',
  end_date: null,
  paid_by: 'owner',
  reminder_days: 5,
  ...overrides,
});

describe('planOf', () => {
  it('distingue pagamento único, parcelado e recorrente', () => {
    expect(planOf({ frequency: 'once', installments_count: 1 })).toBe('single');
    expect(planOf({ frequency: 'monthly', installments_count: 10 })).toBe('installments');
    expect(planOf({ frequency: 'monthly', installments_count: null })).toBe('recurring');
  });
});

describe('dueDateOf', () => {
  it('conta sempre a partir do 1º vencimento, como o Postgres', () => {
    // 31/01 + 1 mês = 28/02; + 2 meses volta a 31/03 (não 28/03).
    expect(dueDateOf('2026-01-31', 'monthly', 2)).toBe('2026-02-28');
    expect(dueDateOf('2026-01-31', 'monthly', 3)).toBe('2026-03-31');
    expect(dueDateOf('2026-03-15', 'quarterly', 3)).toBe('2026-09-15');
    expect(dueDateOf('2026-03-15', 'annual', 2)).toBe('2027-03-15');
  });
});

describe('previewObligationSchedule', () => {
  it('divide o total e joga a sobra do arredondamento na última parcela', () => {
    const items = previewObligationSchedule(
      input({ total_amount: 1000, installments_count: 3, first_due_date: '2026-11-10' }),
      TODAY
    );

    expect(items.map((item) => item.amount)).toEqual([333.33, 333.33, 333.34]);
    expect(items.map((item) => item.due_date)).toEqual(['2026-11-10', '2026-12-10', '2027-01-10']);
    expect(items.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(1000, 2);
  });

  it('arredonda os centavos como o Postgres', () => {
    // 3500,05 / 10 = 350,005: o banco gera 350,01 (e 349,96 na última).
    const items = previewObligationSchedule(input({ total_amount: 3500.05, installments_count: 10 }), TODAY);
    expect(items[0].amount).toBe(350.01);
    expect(items[9].amount).toBe(349.96);
  });

  it('usa o valor da parcela quando informado, ignorando o total', () => {
    const items = previewObligationSchedule(
      input({ installment_amount: 400, total_amount: 3500, installments_count: 2 }),
      TODAY
    );
    expect(items.map((item) => item.amount)).toEqual([400, 400]);
  });

  it('pagamento único gera um vencimento', () => {
    const items = previewObligationSchedule(
      input({ frequency: 'once', installments_count: 1, total_amount: 3200, first_due_date: '2027-02-10' }),
      TODAY
    );
    expect(items).toEqual([{ installment_number: 1, amount: 3200, due_date: '2027-02-10' }]);
  });

  it('série sem fim gera 12 meses à frente', () => {
    const items = previewObligationSchedule(
      input({ installments_count: null, installment_amount: 800, total_amount: null, first_due_date: '2026-11-05' }),
      TODAY
    );

    expect(items[0].due_date).toBe('2026-11-05');
    // Janela termina em 07/10/2027: o último vencimento cabível é 05/10/2027.
    expect(items[items.length - 1].due_date).toBe('2027-10-05');
    expect(items).toHaveLength(12);
  });

  it('série sem fim respeita a data final', () => {
    const items = previewObligationSchedule(
      input({
        installments_count: null,
        installment_amount: 800,
        total_amount: null,
        first_due_date: '2026-11-05',
        end_date: '2027-01-31',
      }),
      TODAY
    );
    expect(items.map((item) => item.due_date)).toEqual(['2026-11-05', '2026-12-05', '2027-01-05']);
  });

  it('não gera nada sem valor ou sem data', () => {
    expect(previewObligationSchedule(input({ total_amount: null, installment_amount: null }), TODAY)).toEqual([]);
    expect(previewObligationSchedule(input({ first_due_date: '' }), TODAY)).toEqual([]);
    // Recorrente exige o valor de cada vencimento; o total não basta.
    expect(
      previewObligationSchedule(input({ installments_count: null, installment_amount: null, total_amount: 900 }), TODAY)
    ).toEqual([]);
  });
});

describe('isObligationInstallmentOverdue', () => {
  it('só considera vencido o que está em aberto e passou de hoje', () => {
    expect(isObligationInstallmentOverdue({ status: 'pending', due_date: '2026-10-06' }, TODAY)).toBe(true);
    expect(isObligationInstallmentOverdue({ status: 'pending', due_date: '2026-10-07' }, TODAY)).toBe(false);
    expect(isObligationInstallmentOverdue({ status: 'paid', due_date: '2026-01-01' }, TODAY)).toBe(false);
    expect(isObligationInstallmentOverdue({ status: 'cancelled', due_date: '2026-01-01' }, TODAY)).toBe(false);
  });
});

describe('installmentLabelOf', () => {
  it('rotula conforme a forma da série', () => {
    const item = { installment_number: 3, due_date: '2026-10-10' };
    expect(installmentLabelOf(item, { frequency: 'monthly', installments_count: 10 })).toBe('3/10');
    expect(installmentLabelOf(item, { frequency: 'once', installments_count: 1 })).toBe('Única');
    expect(installmentLabelOf(item, { frequency: 'monthly', installments_count: null })).toBe('out/2026');
  });
});

describe('summarizeObligations', () => {
  it('separa em aberto, vencido, próximos 12 meses e pago no ano', () => {
    const iptu: PropertyObligationWithInstallments = {
      ...obligation(),
      installments: [
        installment({ due_date: '2026-09-10', status: 'paid', paid_date: '2026-09-09', paid_amount: 360 }),
        installment({ due_date: '2026-10-01' }), // vencida
        installment({ due_date: '2026-11-10' }),
        installment({ due_date: '2026-12-10', status: 'cancelled' }),
      ],
    };
    const condoByTenant: PropertyObligationWithInstallments = {
      ...obligation({ id: 'ob-2', obligation_type: 'condo', title: 'Condomínio', paid_by: 'tenant' }),
      installments: [installment({ obligation_id: 'ob-2', due_date: '2026-10-05', amount: 800 })],
    };

    const summary = summarizeObligations([iptu, condoByTenant], TODAY);

    // Só o proprietário conta como "a pagar".
    expect(summary.pendingAmount).toBe(700);
    expect(summary.pendingCount).toBe(2);
    expect(summary.next12MonthsAmount).toBe(350);
    // Vencido inclui a conta do inquilino: ela pede confirmação.
    expect(summary.overdueCount).toBe(2);
    expect(summary.overdueAmount).toBe(1150);
    expect(summary.paidThisYearAmount).toBe(360);
    expect(summary.nextDue?.due_date).toBe('2026-10-01');
    expect(summary.nextDue?.obligation.title).toBe('IPTU 2026');
  });
});

describe('buildRenewalInput', () => {
  it('leva a conta para o próximo exercício', () => {
    const renewal = buildRenewalInput(obligation());

    expect(renewal.title).toBe('IPTU 2027');
    expect(renewal.reference_year).toBe(2027);
    expect(renewal.first_due_date).toBe('2027-02-10');
    expect(renewal.installments_count).toBe(10);
    expect(renewal.total_amount).toBe(3500);
    expect(renewal.status).toBe('active');
  });

  it('mantém o título quando ele não traz o ano', () => {
    const renewal = buildRenewalInput(obligation({ title: 'Seguro incêndio', reference_year: null, frequency: 'once' }));
    expect(renewal.title).toBe('Seguro incêndio');
    expect(renewal.reference_year).toBeNull();
  });

  it('só oferece renovação para séries com fim', () => {
    expect(canRenew({ frequency: 'once', installments_count: 1 })).toBe(true);
    expect(canRenew({ frequency: 'monthly', installments_count: 10 })).toBe(true);
    expect(canRenew({ frequency: 'monthly', installments_count: null })).toBe(false);
  });
});

describe('validateObligationInput', () => {
  it('aceita um IPTU parcelado completo', () => {
    expect(validateObligationInput(input())).toEqual([]);
  });

  it('aponta o que falta', () => {
    expect(validateObligationInput(input({ title: ' ', total_amount: null }))).toEqual([
      'Informe a descrição da conta.',
      'Informe o valor total ou o valor de cada parcela.',
    ]);
    expect(
      validateObligationInput(input({ installments_count: null, installment_amount: null, total_amount: 500 }))
    ).toEqual(['Informe o valor de cada vencimento.']);
    expect(
      validateObligationInput(
        input({ installments_count: null, installment_amount: 500, end_date: '2027-01-01' })
      )
    ).toEqual(['A data final não pode ser anterior ao primeiro vencimento.']);
    expect(validateObligationInput(input({ reminder_days: 120 }))).toEqual([
      'A antecedência do aviso deve ficar entre 0 e 90 dias.',
    ]);
  });
});
