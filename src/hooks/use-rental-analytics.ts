
import { useMemo } from 'react';
import { useRentalHistory } from './use-rental-history';
import { useProperties } from './use-properties';
import { useFinancialTransactions } from './use-financial-transactions';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface RentalAnalytics {
  monthlyROI: {
    lastMonth: number;
    average12Months: number;
    onInvestment: number;
    onMarketValue: number;
    trend: 'up' | 'down' | 'neutral';
  };
  roiByPropertyType: Record<string, {
    lastMonth: number;
    average12Months: number;
    totalInvestment: number;
    totalMarketValue: number;
  }>;
}

interface MonthlyBalance {
  month: string;
  revenue: number;
  expenses: number;
  netBalance: number;
}

export const useRentalAnalytics = (): RentalAnalytics => {
  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();

  return useMemo(() => {
    // Função auxiliar para calcular saldo mensal
    const calculateMonthlyBalances = (): MonthlyBalance[] => {
      const balances: Record<string, MonthlyBalance> = {};
      
      // Processar todas as transações
      transactions.forEach(transaction => {
        const monthKey = format(new Date(transaction.transaction_date), 'yyyy-MM');
        
        if (!balances[monthKey]) {
          balances[monthKey] = {
            month: monthKey,
            revenue: 0,
            expenses: 0,
            netBalance: 0
          };
        }
        
        if (transaction.transaction_type === 'income') {
          balances[monthKey].revenue += Number(transaction.amount);
        } else {
          balances[monthKey].expenses += Number(transaction.amount);
        }
        
        balances[monthKey].netBalance = balances[monthKey].revenue - balances[monthKey].expenses;
      });
      
      return Object.values(balances).sort((a, b) => b.month.localeCompare(a.month));
    };

    // Calcular saldos mensais
    const monthlyBalances = calculateMonthlyBalances();
    
    // Obter último mês e últimos 12 meses
    const now = new Date();
    const lastMonth = format(subMonths(now, 1), 'yyyy-MM');
    const last12Months = Array.from({ length: 12 }, (_, i) => 
      format(subMonths(now, i + 1), 'yyyy-MM')
    );
    
    // Calcular saldo do último mês
    const lastMonthBalance = monthlyBalances.find(b => b.month === lastMonth);
    const lastMonthNetBalance = lastMonthBalance?.netBalance || 0;
    
    // Calcular média dos últimos 12 meses
    const last12MonthsBalances = monthlyBalances.filter(b => 
      last12Months.includes(b.month)
    );
    const averageMonthlyBalance = last12MonthsBalances.length > 0 
      ? last12MonthsBalances.reduce((sum, b) => sum + b.netBalance, 0) / last12MonthsBalances.length
      : 0;

    // Calcular totais de investimento e valor de mercado
    const totalInvestment = properties.reduce((sum, p) => 
      sum + (p.purchase_value || p.total_investment || 0), 0
    );
    const totalMarketValue = properties.reduce((sum, p) => sum + (p.value || 0), 0);

    // Calcular ROI mensal
    const lastMonthROIOnInvestment = totalInvestment > 0 ? (lastMonthNetBalance / totalInvestment) * 100 : 0;
    const lastMonthROIOnMarketValue = totalMarketValue > 0 ? (lastMonthNetBalance / totalMarketValue) * 100 : 0;
    const average12MonthsROI = totalInvestment > 0 ? (averageMonthlyBalance / totalInvestment) * 100 : 0;

    // Determinar tendência
    const trend: 'up' | 'down' | 'neutral' = lastMonthROIOnInvestment > average12MonthsROI ? 'up' : 
                                            lastMonthROIOnInvestment < average12MonthsROI ? 'down' : 'neutral';

    // Calcular ROI por tipo de propriedade
    const roiByPropertyType: Record<string, {
      lastMonth: number;
      average12Months: number;
      totalInvestment: number;
      totalMarketValue: number;
    }> = {};

    // Agrupar propriedades por tipo
    const propertyTypes = properties.reduce((acc, property) => {
      const type = property.type || 'Outros';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(property);
      return acc;
    }, {} as Record<string, typeof properties>);

    // Para cada tipo, calcular métricas baseadas em transações
    Object.entries(propertyTypes).forEach(([type, typeProperties]) => {
      const typePropertyIds = typeProperties.map(p => p.id);
      const typeInvestment = typeProperties.reduce((sum, p) => 
        sum + (p.purchase_value || p.total_investment || 0), 0
      );
      const typeMarketValue = typeProperties.reduce((sum, p) => sum + (p.value || 0), 0);

      // Filtrar transações deste tipo de propriedade
      const typeTransactions = transactions.filter(t => 
        t.property_id && typePropertyIds.includes(t.property_id)
      );

      // Calcular saldo do último mês para este tipo
      const typeLastMonthTransactions = typeTransactions.filter(t => 
        format(new Date(t.transaction_date), 'yyyy-MM') === lastMonth
      );
      const typeLastMonthRevenue = typeLastMonthTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const typeLastMonthExpenses = typeLastMonthTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const typeLastMonthBalance = typeLastMonthRevenue - typeLastMonthExpenses;

      // Calcular média dos últimos 12 meses para este tipo
      const typeLast12MonthsTransactions = typeTransactions.filter(t => 
        last12Months.includes(format(new Date(t.transaction_date), 'yyyy-MM'))
      );
      
      // Agrupar por mês
      const typeMonthlyBalances: Record<string, number> = {};
      typeLast12MonthsTransactions.forEach(t => {
        const monthKey = format(new Date(t.transaction_date), 'yyyy-MM');
        if (!typeMonthlyBalances[monthKey]) {
          typeMonthlyBalances[monthKey] = 0;
        }
        
        if (t.transaction_type === 'income') {
          typeMonthlyBalances[monthKey] += Number(t.amount);
        } else {
          typeMonthlyBalances[monthKey] -= Number(t.amount);
        }
      });
      
      const typeAverageMonthlyBalance = Object.keys(typeMonthlyBalances).length > 0
        ? Object.values(typeMonthlyBalances).reduce((sum, balance) => sum + balance, 0) / Object.keys(typeMonthlyBalances).length
        : 0;

      // Calcular ROI para este tipo
      const typeLastMonthROI = typeInvestment > 0 ? (typeLastMonthBalance / typeInvestment) * 100 : 0;
      const typeAverage12MonthsROI = typeInvestment > 0 ? (typeAverageMonthlyBalance / typeInvestment) * 100 : 0;

      roiByPropertyType[type] = {
        lastMonth: typeLastMonthROI,
        average12Months: typeAverage12MonthsROI,
        totalInvestment: typeInvestment,
        totalMarketValue: typeMarketValue
      };
    });

    return {
      monthlyROI: {
        lastMonth: lastMonthROIOnInvestment,
        average12Months: average12MonthsROI,
        onInvestment: lastMonthROIOnInvestment,
        onMarketValue: lastMonthROIOnMarketValue,
        trend
      },
      roiByPropertyType
    };
  }, [properties, transactions]);
};
