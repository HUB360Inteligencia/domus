
import { useQuery } from '@tanstack/react-query';
import { 
  fetchFinancialMetrics, 
  fetchMonthlyFinancialData, 
  fetchPropertyFinancialRanking,
  FinancialMetrics,
  MonthlyFinancialData,
  PropertyFinancialRanking
} from '@/api/financial-dashboard';

export const useFinancialDashboard = () => {
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics
  } = useQuery<FinancialMetrics>({
    queryKey: ['financial-metrics'],
    queryFn: fetchFinancialMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: monthlyData = [],
    isLoading: isLoadingMonthlyData,
    refetch: refetchMonthlyData
  } = useQuery<MonthlyFinancialData[]>({
    queryKey: ['monthly-financial-data'],
    queryFn: () => fetchMonthlyFinancialData(12),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: propertyRankings = [],
    isLoading: isLoadingRankings,
    refetch: refetchRankings
  } = useQuery<PropertyFinancialRanking[]>({
    queryKey: ['property-financial-rankings'],
    queryFn: fetchPropertyFinancialRanking,
    staleTime: 1000 * 60 * 5,
  });

  return {
    metrics,
    monthlyData,
    propertyRankings,
    isLoading: isLoadingMetrics || isLoadingMonthlyData || isLoadingRankings,
    isLoadingMetrics,
    isLoadingMonthlyData,
    isLoadingRankings,
    refetchMetrics,
    refetchMonthlyData,
    refetchRankings,
    refetchAll: () => {
      refetchMetrics();
      refetchMonthlyData();
      refetchRankings();
    }
  };
};
