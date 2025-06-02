
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RentalItem {
  id?: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  categoryName: string;
}

export interface RentalHistoryItem {
  monthYear: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  individualItems: RentalItem[];
  transactionId: string;
}

export const useRentalHistory = (propertyId: string) => {
  const { data: rentalHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['rental-history', propertyId],
    queryFn: async (): Promise<RentalHistoryItem[]> => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('property_id', propertyId)
        .eq('subcategory', 'rental-management')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching rental history:', error);
        throw error;
      }

      return data.map(transaction => {
        let parsedDescription = null;
        try {
          parsedDescription = JSON.parse(transaction.description || '{}');
        } catch (e) {
          console.error('Error parsing transaction description:', e);
        }

        const monthYear = transaction.transaction_date 
          ? new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
          : 'Data não disponível';

        return {
          monthYear,
          totalIncome: parsedDescription?.totalIncome || 0,
          totalExpense: parsedDescription?.totalExpense || 0,
          balance: parsedDescription?.balance || transaction.amount || 0,
          individualItems: parsedDescription?.items || [],
          transactionId: transaction.id
        };
      });
    },
    enabled: !!propertyId
  });

  // Calculate average monthly revenue
  const averageMonthlyRevenue = rentalHistory.length > 0 
    ? rentalHistory.reduce((sum, item) => sum + item.totalIncome, 0) / rentalHistory.length
    : 0;

  return {
    rentalHistory,
    isLoading,
    refetch,
    averageMonthlyRevenue
  };
};
