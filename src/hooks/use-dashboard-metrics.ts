
import { useMemo } from 'react';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useRentalAnalytics } from './use-rental-analytics';
import { parseDateOnly } from "@/lib/dates";
import { isContractInForce } from "@/lib/contract-status";
import { useOwnershipView } from "@/contexts/OwnershipViewContext";

export interface DashboardMetrics {
  // Portfólio de Imóveis
  totalProperties: number;
  rentableProperties: number;
  rentedProperties: number;
  occupancyRate: number;
  
  // Patrimônio
  totalPurchaseValue: number;
  totalMarketValue: number;
  /** Custo de aquisição por imóvel da carteira (valor de mercado quando o custo não foi informado). */
  investmentBase: number;
  portfolioProperties: number;
  assetGrowthPercentage: number;
  
  // Performance Financeira - CORRIGIDO
  totalRevenue: number;
  totalExpenses: number;
  netBalance: number;
  
  // Rentabilidade - CORRIGIDO
  monthlyROI: {
    lastMonth: number;
    average12Months: number;
    onInvestment: number;
    onMarketValue: number;
    trend: 'up' | 'down' | 'neutral';
  };
  
  // ROI por tipo - CORRIGIDO
  roiByPropertyType: Record<string, {
    lastMonth: number;
    average12Months: number;
    totalInvestment: number;
    totalMarketValue: number;
  }>;
  
  // Tendências
  revenueTrend: 'up' | 'down' | 'neutral';
  expensesTrend: 'up' | 'down' | 'neutral';
  profitTrend: 'up' | 'down' | 'neutral';
}

export const useDashboardMetrics = (): DashboardMetrics => {
  const { properties: grossProperties } = useProperties();
  const { contracts } = useContracts();
  const { transactions: grossTransactions } = useFinancialTransactions();
  const rentalAnalytics = useRentalAnalytics();
  const { mode, factorFor } = useOwnershipView();

  return useMemo(() => {
    // Na visão "minha cota", valores de imóvel e de transação entram já rateados
    // pela participação do titular. Contagens (quantos imóveis, ocupação) não mudam:
    // 40 lotes continuam sendo 40 mesmo numa sociedade 50/50. Percentuais de ROI
    // também não, porque a cota escala numerador e denominador na mesma proporção.
    const properties =
      mode === "gross"
        ? grossProperties
        : grossProperties.map((property) => {
            const factor = factorFor(property.id);
            return {
              ...property,
              value: Number(property.value || 0) * factor,
              purchase_value: property.purchase_value == null ? property.purchase_value : Number(property.purchase_value) * factor,
              total_investment: property.total_investment == null ? property.total_investment : Number(property.total_investment) * factor,
              rental_value: property.rental_value == null ? property.rental_value : Number(property.rental_value) * factor,
            };
          });

    const transactions =
      mode === "gross"
        ? grossTransactions
        : grossTransactions.map((transaction) => ({
            ...transaction,
            amount: Number(transaction.amount || 0) * factorFor(transaction.property_id),
          }));

    // Calcular métricas do portfólio
    const totalProperties = properties.length;
    const rentablePropertiesList = properties.filter(p => p.status !== 'sold');
    const rentablePropertyIds = new Set(rentablePropertiesList.map(p => p.id));
    const activeContracts = contracts.filter(c => isContractInForce(c));
    const rentedPropertyIds = new Set<string>();

    activeContracts.forEach(contract => {
      if (contract.property_id && rentablePropertyIds.has(contract.property_id)) {
        rentedPropertyIds.add(contract.property_id);
      }
    });

    rentablePropertiesList
      .filter(p => p.status === 'rented' || p.status === 'airbnb')
      .forEach(property => rentedPropertyIds.add(property.id));

    const rentableProperties = rentablePropertiesList.length;
    const rentedProperties = rentedPropertyIds.size;
    const occupancyRate = rentableProperties > 0 ? (rentedProperties / rentableProperties) * 100 : 0;

    // Calcular patrimônio — imóveis vendidos não fazem mais parte da carteira
    const portfolioProperties = rentablePropertiesList;
    const totalPurchaseValue = portfolioProperties.reduce((sum, p) =>
      sum + (p.purchase_value || p.total_investment || 0), 0
    );
    const totalMarketValue = portfolioProperties.reduce((sum, p) => sum + (p.value || 0), 0);
    // Base de capital para ROI: custo de aquisição de cada imóvel, ou valor de mercado quando o custo não foi informado
    const investmentBase = portfolioProperties.reduce((sum, p) =>
      sum + Number(p.purchase_value || p.total_investment || p.value || 0), 0
    );
    const comparableProperties = portfolioProperties.filter(p => (p.purchase_value || p.total_investment || 0) > 0);
    const comparablePurchaseValue = comparableProperties.reduce((sum, p) => 
      sum + (p.purchase_value || p.total_investment || 0), 0
    );
    const comparableMarketValue = comparableProperties.reduce((sum, p) => sum + (p.value || 0), 0);
    const assetGrowthPercentage = comparablePurchaseValue > 0 
      ? ((comparableMarketValue - comparablePurchaseValue) / comparablePurchaseValue) * 100 
      : 0;

    // Calcular performance financeira - TOTAIS (não apenas mês atual)
    const totalRevenue = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netBalance = totalRevenue - totalExpenses;

    // Calcular tendências (comparando com mês anterior)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = parseDateOnly(t.transaction_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = parseDateOnly(t.transaction_date);
      return transactionDate.getMonth() === previousMonth && 
             transactionDate.getFullYear() === previousYear;
    });

    const currentMonthRevenue = currentMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousMonthRevenue = previousMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousMonthExpenses = previousMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
    const previousMonthProfit = previousMonthRevenue - previousMonthExpenses;

    const revenueTrend = currentMonthRevenue > previousMonthRevenue ? 'up' : 
                        currentMonthRevenue < previousMonthRevenue ? 'down' : 'neutral';
    
    const expensesTrend = currentMonthExpenses > previousMonthExpenses ? 'up' : 
                         currentMonthExpenses < previousMonthExpenses ? 'down' : 'neutral';
    
    const profitTrend = currentMonthProfit > previousMonthProfit ? 'up' : 
                       currentMonthProfit < previousMonthProfit ? 'down' : 'neutral';

    return {
      totalProperties,
      rentableProperties,
      rentedProperties,
      occupancyRate,
      totalPurchaseValue,
      totalMarketValue,
      investmentBase,
      portfolioProperties: portfolioProperties.length,
      assetGrowthPercentage,
      totalRevenue,
      totalExpenses,
      netBalance,
      monthlyROI: rentalAnalytics.monthlyROI,
      roiByPropertyType: rentalAnalytics.roiByPropertyType,
      revenueTrend,
      expensesTrend,
      profitTrend
    };
  }, [grossProperties, contracts, grossTransactions, rentalAnalytics, mode, factorFor]);
};
