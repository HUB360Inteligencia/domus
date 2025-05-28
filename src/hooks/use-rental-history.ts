
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RentalHistoryItem {
  month: string;
  monthYear: string;
  description: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionDate: string;
}

export const useRentalHistory = (propertyId: string | null) => {
  const { data: rentalHistory = [], isLoading } = useQuery({
    queryKey: ['rental-history', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('property_id', propertyId)
        .eq('subcategory', 'rental-management')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching rental history:', error);
        return [];
      }

      return data.map(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthYear = date.toLocaleDateString('pt-BR', { 
          month: '2-digit', 
          year: 'numeric' 
        });
        const monthName = date.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });

        // Extract details from description
        const description = transaction.description || '';
        const detailsMatch = description.match(/- (.+)$/);
        const details = detailsMatch ? detailsMatch[1] : 'Gestão de aluguéis';

        return {
          month: monthName,
          monthYear,
          description: details,
          totalIncome: transaction.transaction_type === 'income' ? transaction.amount : 0,
          totalExpense: transaction.transaction_type === 'expense' ? transaction.amount : 0,
          balance: transaction.transaction_type === 'income' ? transaction.amount : -transaction.amount,
          transactionDate: transaction.transaction_date
        };
      }) as RentalHistoryItem[];
    },
    enabled: !!propertyId
  });

  const averageMonthlyRevenue = rentalHistory.length > 0 
    ? rentalHistory.filter(item => item.totalIncome > 0).reduce((sum, item) => sum + item.totalIncome, 0) / Math.max(1, rentalHistory.filter(item => item.totalIncome > 0).length)
    : 0;

  return {
    rentalHistory,
    isLoading,
    averageMonthlyRevenue
  };
};
