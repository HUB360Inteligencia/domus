import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { calculateVacancyRate, computePropertyFinancialMetrics } from "./property-financial-metrics";

const now = new Date(2026, 8, 18, 12, 0, 0);

describe("computePropertyFinancialMetrics", () => {
  const base = {
    property: { purchase_value: 400_000, total_investment: null, value: 500_000 },
    investments: [{ amount: 20_000 }],
    contracts: [],
    now,
  };

  it("separa o acumulado dos últimos 12 meses", () => {
    const metrics = computePropertyFinancialMetrics({
      ...base,
      transactions: [
        { amount: 3_000, transaction_type: "income", transaction_date: "2026-09-01" },
        { amount: 3_000, transaction_type: "income", transaction_date: "2026-08-01" },
        { amount: 500, transaction_type: "expense", transaction_date: "2026-08-10" },
        // fora da janela de 12 meses
        { amount: 10_000, transaction_type: "income", transaction_date: "2024-01-01" },
      ],
    });

    expect(metrics.totalRevenue).toBe(16_000);
    expect(metrics.netIncome).toBe(15_500);
    expect(metrics.revenueLast12Months).toBe(6_000);
    expect(metrics.expensesLast12Months).toBe(500);
    expect(metrics.netIncomeLast12Months).toBe(5_500);
  });

  it("usa compra + investimentos como capital e calcula o ROI mensal médio", () => {
    const metrics = computePropertyFinancialMetrics({
      ...base,
      transactions: [{ amount: 12_600, transaction_type: "income", transaction_date: "2026-05-05" }],
    });

    expect(metrics.totalInvestment).toBe(420_000);
    expect(metrics.capitalBase).toBe(420_000);
    // 12.600 / 12 meses / 420.000 = 0,25% ao mês
    expect(metrics.monthlyProfitability).toBeCloseTo(0.25, 6);
  });

  it("cai para o valor de mercado quando não há custo cadastrado", () => {
    const metrics = computePropertyFinancialMetrics({
      ...base,
      property: { purchase_value: null, total_investment: null, value: 600_000 },
      investments: [],
      transactions: [{ amount: 7_200, transaction_type: "income", transaction_date: "2026-03-10" }],
    });

    expect(metrics.totalInvestment).toBe(0);
    expect(metrics.capitalBase).toBe(600_000);
    expect(metrics.monthlyProfitability).toBeCloseTo(0.1, 6);
  });

  it("considera 100% de vacância sem contratos", () => {
    const metrics = computePropertyFinancialMetrics({ ...base, transactions: [] });
    expect(metrics.vacancyRate).toBe(100);
  });
});

describe("calculateVacancyRate", () => {
  it("não conta em dobro contratos sobrepostos", () => {
    const rate = calculateVacancyRate(
      [
        { start_date: "2025-01-01", end_date: "2027-01-01", status: "active" },
        { start_date: "2025-06-01", end_date: "2026-12-01", status: "expired" },
      ],
      now,
    );
    expect(rate).toBe(0);
  });

  it("mede os dias sem contrato dentro da janela de 12 meses", () => {
    // Contrato cobre só os últimos ~6 meses da janela
    const rate = calculateVacancyRate(
      [{ start_date: "2026-03-18", end_date: "2027-03-18", status: "active" }],
      now,
    );
    expect(rate).toBeGreaterThan(45);
    expect(rate).toBeLessThan(55);
  });

  it("ignora contratos cancelados ou em rascunho", () => {
    const rate = calculateVacancyRate(
      [{ start_date: "2025-01-01", end_date: "2027-01-01", status: "canceled" }],
      now,
    );
    expect(rate).toBe(100);
  });
});
