
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyValuations, 
  createPropertyValuation, 
  updatePropertyValuation, 
  deletePropertyValuation 
} from '@/api/property-valuations';
import { PropertyValuation } from '@/types/property';

export const usePropertyValuations = (propertyId: string | null) => {
  const queryClient = useQueryClient();
  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);

  // Fetch all valuations for a property
  const { 
    data: valuations = [], 
    isLoading: isLoadingValuations,
    refetch: refetchValuations,
  } = useQuery({
    queryKey: ['property-valuations', propertyId],
    queryFn: () => fetchPropertyValuations(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create mutation
  const createValuationMutation = useMutation({
    mutationFn: ({ value, date, notes }: { value: number; date?: string; notes?: string }) => 
      createPropertyValuation(propertyId || '', value, date, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-valuations', propertyId] });
      toast.success('Avaliação de imóvel criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar avaliação: ${error.message}`);
    }
  });

  // Update mutation
  const updateValuationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PropertyValuation> }) => 
      updatePropertyValuation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-valuations', propertyId] });
      toast.success('Avaliação de imóvel atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar avaliação: ${error.message}`);
    }
  });

  // Delete mutation
  const deleteValuationMutation = useMutation({
    mutationFn: (id: string) => deletePropertyValuation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-valuations', propertyId] });
      toast.success('Avaliação de imóvel excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir avaliação: ${error.message}`);
    }
  });

  // Get the selected valuation
  const selectedValuation = selectedValuationId 
    ? valuations.find(v => v.id === selectedValuationId) 
    : null;

  // Get the latest valuation
  const latestValuation = valuations.length > 0
    ? valuations.reduce((latest, current) => {
        return new Date(current.valuation_date) > new Date(latest.valuation_date) 
          ? current 
          : latest;
      }, valuations[0])
    : null;

  // Calculate valuation growth
  const calculateGrowth = () => {
    if (valuations.length <= 1) return { percentage: 0, absolute: 0 };
    
    const firstValuation = valuations[0];
    const lastValuation = valuations[valuations.length - 1];
    
    const absolute = lastValuation.value - firstValuation.value;
    const percentage = (absolute / firstValuation.value) * 100;
    
    return { percentage, absolute };
  };

  return {
    valuations,
    isLoading: isLoadingValuations,
    refetchValuations,
    selectedValuation,
    latestValuation,
    growth: calculateGrowth(),
    setSelectedValuationId,
    createValuation: createValuationMutation.mutateAsync,
    updateValuation: updateValuationMutation.mutateAsync,
    deleteValuation: deleteValuationMutation.mutateAsync,
    isCreating: createValuationMutation.isPending,
    isUpdating: updateValuationMutation.isPending,
    isDeleting: deleteValuationMutation.isPending,
  };
};
