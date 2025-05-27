
import { useQuery } from '@tanstack/react-query';
import { useFinancialTransactions } from './use-financial-transactions';

interface FinancialSummaryData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export const useFinancialSummary = (period: string) => {
  const { transactions } = useFinancialTransactions();

  return useQuery({
    queryKey: ['financial-summary', period],
    queryFn: () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (period) {
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'currentMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'currentYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'last12Months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = now;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      const totalIncome = filteredTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalExpenses = filteredTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses
      } as FinancialSummaryData;
    },
    enabled: !!transactions
  });
};
