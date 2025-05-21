
import { useQuery } from '@tanstack/react-query';
import { fetchPropertyExpenses } from '@/api/property-expenses';
import { calculateExpenseAnalytics } from '@/api/property-expenses';

export const usePropertyExpenseQueries = (propertyId: string | null) => {
  const { 
    data: expenses = [], 
    isLoading: isLoadingExpenses,
    refetch: refetchExpenses
  } = useQuery({
    queryKey: ['property-expenses', propertyId],
    queryFn: () => fetchPropertyExpenses(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate analytics from the expense data
  const analytics = calculateExpenseAnalytics(expenses);
  
  return {
    expenses,
    analytics,
    isLoadingExpenses,
    refetchExpenses,
  };
};
