
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  calculatePropertyFinancialData,
  generateMonthlyFinancialReport,
  generateRoiComparisonData
} from '@/api/property-financial';
import { PropertyFinancialData } from '@/types/property';

export const usePropertyFinancial = (propertyId: string | null) => {
  const queryClient = useQueryClient();

  const { 
    data: financialData, 
    isLoading: isLoadingFinancial,
    refetch: refetchFinancial
  } = useQuery<PropertyFinancialData>({
    queryKey: ['propertyFinancial', propertyId],
    queryFn: () => calculatePropertyFinancialData(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: monthlyReportData = [], 
    isLoading: isLoadingMonthlyReport,
    refetch: refetchMonthlyReport
  } = useQuery({
    queryKey: ['propertyMonthlyReport', propertyId],
    queryFn: () => generateMonthlyFinancialReport(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: roiComparisonData = [], 
    isLoading: isLoadingRoiComparison,
    refetch: refetchRoiComparison
  } = useQuery({
    queryKey: ['propertyRoiComparison', propertyId],
    queryFn: () => generateRoiComparisonData(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const calculateFinancialMutation = useMutation({
    mutationFn: () => calculatePropertyFinancialData(propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyFinancial', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Dados financeiros calculados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao calcular dados financeiros: ${error.message}`);
    }
  });

  const isLoading = isLoadingFinancial || isLoadingMonthlyReport || isLoadingRoiComparison;

  const refreshFinancialData = () => {
    refetchFinancial();
    refetchMonthlyReport();
    refetchRoiComparison();
  };

  return {
    financialData,
    monthlyReportData,
    roiComparisonData,
    isLoading,
    isCalculating: calculateFinancialMutation.isPending,
    calculateFinancial: calculateFinancialMutation.mutate,
    refreshFinancialData
  };
};
