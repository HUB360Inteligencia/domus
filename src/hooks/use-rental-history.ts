
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

interface GroupedRentalData {
  month: string;
  monthYear: string;
  totalIncome: number;
  totalExpense: number;
  transactionDate: string;
  individualItems: RentalItem[];
}

export const useRentalHistory = (propertyId: string | null) => {
  const { data: rentalHistory = [], isLoading } = useQuery({
    queryKey: ['rental-history', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      // Buscar todas as transações individuais (rental-item) para este imóvel
      const { data: individualTransactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          financial_categories:category (name)
        `)
        .eq('property_id', propertyId)
        .eq('subcategory', 'rental-item')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching rental history:', error);
        return [];
      }

      // Agrupar transações por mês/ano
      const groupedByMonth = individualTransactions?.reduce((acc, transaction) => {
        const date = new Date(transaction.transaction_date);
        const monthKey = format(date, 'yyyy-MM');
        const monthYear = format(date, 'MM/yyyy');
        const monthName = format(date, 'MMMM yyyy', { locale: ptBR });

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthName,
            monthYear,
            totalIncome: 0,
            totalExpense: 0,
            transactionDate: transaction.transaction_date,
            individualItems: []
          };
        }

        const item: RentalItem = {
          id: transaction.id,
          name: transaction.name,
          amount: transaction.amount,
          type: transaction.transaction_type as 'income' | 'expense',
          categoryName: transaction.financial_categories?.name || 'Categoria não encontrada',
          description: transaction.description
        };

        acc[monthKey].individualItems.push(item);

        if (transaction.transaction_type === 'income') {
          acc[monthKey].totalIncome += transaction.amount;
        } else {
          acc[monthKey].totalExpense += transaction.amount;
        }

        return acc;
      }, {} as Record<string, GroupedRentalData>) || {};

      // Converter para array e calcular saldos e descrições
      const historyItems: RentalHistoryItem[] = Object.values(groupedByMonth).map((group: GroupedRentalData) => {
        const balance = group.totalIncome - group.totalExpense;
        const description = group.individualItems
          .map(item => `${item.name}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}`)
          .join(' | ');

        return {
          month: group.month,
          monthYear: group.monthYear,
          totalIncome: group.totalIncome,
          totalExpense: group.totalExpense,
          balance,
          transactionDate: group.transactionDate,
          individualItems: group.individualItems,
          description: description || 'Gestão de aluguéis'
        };
      });

      return historyItems.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
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
