
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchContractAdjustments, createContractAdjustment, updateContractValue } from '@/api/contract-adjustments';
import { ContractAdjustmentFormData } from '@/types/contract-adjustment';

export const useContractAdjustments = (contractId?: string) => {
  const queryClient = useQueryClient();

  // Fetch contract adjustments
  const {
    data: adjustments = [],
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments,
  } = useQuery({
    queryKey: ['contractAdjustments', contractId],
    queryFn: () => fetchContractAdjustments(contractId || ''),
    enabled: !!contractId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create adjustment mutation
  const { mutateAsync: createAdjustment, isPending: isCreatingAdjustment } = useMutation({
    mutationFn: createContractAdjustment,
    onSuccess: async (data) => {
      // Update contract value
      await updateContractValue(data.contract_id, data.new_value);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['contractAdjustments', data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.contract_id] });
      
      toast.success('Reajuste aplicado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao aplicar reajuste: ${error.message}`);
    },
  });

  return {
    adjustments,
    isLoadingAdjustments,
    refetchAdjustments,
    createAdjustment,
    isCreatingAdjustment,
  };
};
