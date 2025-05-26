
import { useQuery } from '@tanstack/react-query';
import { fetchPropertyFinancialMetrics, fetchActiveContractForProperty } from '@/api/property-financial-metrics';

export const usePropertyFinancialMetrics = (propertyId: string | null) => {
  const {
    data: financialMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['property-financial-metrics', propertyId],
    queryFn: () => fetchPropertyFinancialMetrics(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: activeContract,
    isLoading: isLoadingContract,
  } = useQuery({
    queryKey: ['property-active-contract', propertyId],
    queryFn: () => fetchActiveContractForProperty(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    financialMetrics,
    activeContract,
    isLoadingMetrics,
    isLoadingContract,
    refetchMetrics,
  };
};
