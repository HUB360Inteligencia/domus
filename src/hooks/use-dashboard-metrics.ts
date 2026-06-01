
import { useMemo } from 'react';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useRentalAnalytics } from './use-rental-analytics';

export interface DashboardMetrics {
  // Portfólio de Imóveis
  totalProperties: number;
  rentableProperties: number;
  rentedProperties: number;
  occupancyRate: number;
  
  // Patrimônio
  totalPurchaseValue: number;
  totalMarketValue: number;
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
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const { transactions } = useFinancialTransactions();
  const rentalAnalytics = useRentalAnalytics();

  return useMemo(() => {
    // Calcular métricas do portfólio
    const totalProperties = properties.length;
    const rentablePropertiesList = properties.filter(p => p.status !== 'sold');
    const rentablePropertyIds = new Set(rentablePropertiesList.map(p => p.id));
    const activeContracts = contracts.filter(c => c.status === 'active');
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

    // Calcular patrimônio
    const totalPurchaseValue = properties.reduce((sum, p) => 
      sum + (p.purchase_value || p.total_investment || 0), 0
    );
    const totalMarketValue = properties.reduce((sum, p) => sum + (p.value || 0), 0);
    const comparableProperties = properties.filter(p => (p.purchase_value || p.total_investment || 0) > 0);
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
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
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
  }, [properties, contracts, transactions, rentalAnalytics]);
};
