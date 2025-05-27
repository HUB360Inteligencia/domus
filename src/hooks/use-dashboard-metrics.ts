
import { useMemo } from 'react';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';

export interface DashboardMetrics {
  // Portfólio de Imóveis
  totalProperties: number;
  rentedProperties: number;
  occupancyRate: number;
  
  // Patrimônio
  totalPurchaseValue: number;
  totalMarketValue: number;
  assetGrowthPercentage: number;
  
  // Performance Financeira Mensal
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  
  // Rentabilidade
  roiOnInvestment: number; // Retorno sobre valor investido
  currentYield: number; // Retorno sobre valor de mercado
  
  // Tendências
  revenueTrend: 'up' | 'down' | 'neutral';
  expensesTrend: 'up' | 'down' | 'neutral';
  profitTrend: 'up' | 'down' | 'neutral';
}

export const useDashboardMetrics = (): DashboardMetrics => {
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const { transactions } = useFinancialTransactions();

  return useMemo(() => {
    // Calcular métricas do portfólio
    const totalProperties = properties.length;
    const activeContracts = contracts.filter(c => c.status === 'active');
    const rentedProperties = activeContracts.length;
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

    // Calcular patrimônio
    const totalPurchaseValue = properties.reduce((sum, p) => 
      sum + (p.purchase_value || p.total_investment || 0), 0
    );
    const totalMarketValue = properties.reduce((sum, p) => sum + (p.value || 0), 0);
    const assetGrowthPercentage = totalPurchaseValue > 0 
      ? ((totalMarketValue - totalPurchaseValue) / totalPurchaseValue) * 100 
      : 0;

    // Calcular performance financeira do mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyRevenue = currentMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // Calcular rentabilidade
    const roiOnInvestment = totalPurchaseValue > 0 
      ? (monthlyRevenue / totalPurchaseValue) * 100 * 12 // Anualizado
      : 0;

    const currentYield = totalMarketValue > 0 
      ? (monthlyRevenue / totalMarketValue) * 100 * 12 // Anualizado
      : 0;

    // Calcular tendências (comparando com mês anterior)
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === previousMonth && 
             transactionDate.getFullYear() === previousYear;
    });

    const previousMonthRevenue = previousMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousMonthExpenses = previousMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousMonthProfit = previousMonthRevenue - previousMonthExpenses;

    const revenueTrend = monthlyRevenue > previousMonthRevenue ? 'up' : 
                        monthlyRevenue < previousMonthRevenue ? 'down' : 'neutral';
    
    const expensesTrend = monthlyExpenses > previousMonthExpenses ? 'up' : 
                         monthlyExpenses < previousMonthExpenses ? 'down' : 'neutral';
    
    const profitTrend = monthlyProfit > previousMonthProfit ? 'up' : 
                       monthlyProfit < previousMonthProfit ? 'down' : 'neutral';

    return {
      totalProperties,
      rentedProperties,
      occupancyRate,
      totalPurchaseValue,
      totalMarketValue,
      assetGrowthPercentage,
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit,
      roiOnInvestment,
      currentYield,
      revenueTrend,
      expensesTrend,
      profitTrend
    };
  }, [properties, contracts, transactions]);
};
