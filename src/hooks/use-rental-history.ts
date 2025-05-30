
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface RentalHistoryItem {
  month: string;
  monthYear: string;
  description: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionDate: string;
  individualItems: RentalItem[];
}

export interface RentalItem {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  categoryName: string;
  description?: string;
}

interface RentalDetails {
  items: Array<{
    name: string;
    amount: number;
    type: 'income' | 'expense';
    categoryName: string;
  }>;
  summary: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const useRentalHistory = (propertyId: string | null) => {
  const { data: rentalHistory = [], isLoading } = useQuery({
    queryKey: ['rental-history', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      // Buscar transações de gestão de aluguéis (apenas as transações resumo)
      const { data: rentalTransactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          financial_categories:category (name)
        `)
        .eq('property_id', propertyId)
        .eq('subcategory', 'rental-management')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching rental history:', error);
        return [];
      }

      // Processar transações para extrair detalhes
      const historyItems: RentalHistoryItem[] = rentalTransactions?.map(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthName = format(date, 'MMMM yyyy', { locale: ptBR });
        const monthYear = format(date, 'MM/yyyy');

        let rentalDetails: RentalDetails | null = null;
        let individualItems: RentalItem[] = [];

        // Tentar parsear o JSON da description para extrair detalhes
        try {
          if (transaction.description) {
            rentalDetails = JSON.parse(transaction.description) as RentalDetails;
            individualItems = rentalDetails.items.map((item, index) => ({
              id: `${transaction.id}-${index}`,
              name: item.name,
              amount: item.amount,
              type: item.type,
              categoryName: item.categoryName
            }));
          }
        } catch (error) {
          console.log('Não foi possível parsear detalhes do aluguel:', error);
        }

        // Se não conseguiu parsear ou não tem detalhes, usar dados da transação
        const totalIncome = rentalDetails?.totalIncome || 
          (transaction.transaction_type === 'income' ? transaction.amount : 0);
        const totalExpense = rentalDetails?.totalExpense || 
          (transaction.transaction_type === 'expense' ? transaction.amount : 0);
        const balance = rentalDetails?.balance || 
          (transaction.transaction_type === 'income' ? transaction.amount : -transaction.amount);

        return {
          month: monthName,
          monthYear,
          totalIncome,
          totalExpense,
          balance,
          transactionDate: transaction.transaction_date,
          individualItems,
          description: transaction.name || 'Gestão de aluguéis'
        };
      }) || [];

      return historyItems;
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
