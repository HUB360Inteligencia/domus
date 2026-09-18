import type { QueryClient } from "@tanstack/react-query";

// Consultas cujos números derivam de transações financeiras e/ou contratos.
const FINANCIAL_DERIVED_PREFIXES = [
  "financial-",
  "property-transactions",
  "property-financial",
  "property-analytics",
  "property-filter-options",
  "monthly-financial-data",
  "neighborhood-financial-data",
  "rental-",
  "agenda-events",
  "dashboard-metrics",
  "analytics-",
  "kpi-metrics",
  "portfolio-timeline",
  "contact-financial",
  "active-contract",
  "property-active-contract",
  "upcoming-events",
  "contract-stats",
];

const matchesPrefix = (key: unknown) =>
  typeof key === "string" && FINANCIAL_DERIVED_PREFIXES.some((prefix) => key.startsWith(prefix));

/**
 * Após gravar uma transação/contrato, atualiza tudo que é calculado a partir disso
 * (dashboard, analytics do imóvel, agenda...), e não só a lista que originou a mudança.
 */
export function invalidateFinancialData(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => matchesPrefix(query.queryKey[0]),
  });
}
