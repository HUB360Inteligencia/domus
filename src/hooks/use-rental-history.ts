
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
  description: string;
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
        let individualItems: RentalItem[] = [];
        let totalIncome = 0;
        let totalExpense = 0;
        let balance = 0;

        // Tentar fazer parse da descrição se for JSON
        try {
          if (transaction.description && transaction.description.trim().startsWith('{')) {
            parsedDescription = JSON.parse(transaction.description);
            individualItems = parsedDescription?.items || [];
            totalIncome = parsedDescription?.totalIncome || 0;
            totalExpense = parsedDescription?.totalExpense || 0;
            balance = parsedDescription?.balance || transaction.amount || 0;
          }
        } catch (e) {
          // Se não for JSON válido, não é problema - usamos valores padrão
          console.log('Description is not JSON, using transaction amount as balance');
        }

        // Se não conseguimos extrair dados do JSON, usar dados da transação
        if (!parsedDescription) {
          balance = transaction.transaction_type === 'income' 
            ? Number(transaction.amount) 
            : -Number(transaction.amount);
          
          if (transaction.transaction_type === 'income') {
            totalIncome = Number(transaction.amount);
          } else {
            totalExpense = Number(transaction.amount);
          }
        }

        const monthYear = transaction.transaction_date 
          ? new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
          : 'Data não disponível';

        return {
          monthYear,
          totalIncome,
          totalExpense,
          balance,
          individualItems,
          transactionId: transaction.id,
          description: transaction.description || ''
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
