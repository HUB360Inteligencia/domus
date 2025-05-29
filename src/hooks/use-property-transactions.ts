
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format } from 'date-fns';

export interface PropertyTransaction {
  id: string;
  name: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  transaction_date: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
}

export interface MonthlyRevenue {
  month: string;
  totalRevenue: number;
  transactionCount: number;
}

export const usePropertyTransactions = (propertyId: string | null, months: number = 12) => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['property-transactions', propertyId, months],
    queryFn: async () => {
      if (!propertyId) return [];

      const startDate = format(subMonths(new Date(), months), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('property_id', propertyId)
        .eq('transaction_type', 'income')
        .gte('transaction_date', startDate)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching property transactions:', error);
        return [];
      }

      return data as PropertyTransaction[];
    },
    enabled: !!propertyId
  });

  // Calcular receita média mensal
  const calculateAverageMonthlyRevenue = () => {
    if (transactions.length === 0) return 0;

    // Agrupar por mês
    const monthlyTotals = transactions.reduce((acc, transaction) => {
      const monthKey = format(new Date(transaction.transaction_date), 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    const monthsWithData = Object.keys(monthlyTotals).length;
    const totalRevenue = Object.values(monthlyTotals).reduce((sum, amount) => sum + amount, 0);

    return monthsWithData > 0 ? totalRevenue / monthsWithData : 0;
  };

  // Obter receitas mensais detalhadas
  const getMonthlyRevenues = (): MonthlyRevenue[] => {
    const monthlyData = transactions.reduce((acc, transaction) => {
      const monthKey = format(new Date(transaction.transaction_date), 'yyyy-MM');
      const monthName = format(new Date(transaction.transaction_date), 'MMM/yyyy');
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          totalRevenue: 0,
          transactionCount: 0
        };
      }
      
      acc[monthKey].totalRevenue += transaction.amount;
      acc[monthKey].transactionCount += 1;
      
      return acc;
    }, {} as Record<string, MonthlyRevenue>);

    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
  };

  return {
    transactions,
    isLoading,
    averageMonthlyRevenue: calculateAverageMonthlyRevenue(),
    monthlyRevenues: getMonthlyRevenues(),
    totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length
  };
};
