
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyOccupancyPeriods, 
  createPropertyOccupancyPeriod, 
  updatePropertyOccupancyPeriod,
  deletePropertyOccupancyPeriod,
  calculateVacancyRate
} from '@/api/property-occupancy';
import { 
  PropertyOccupancyFormData, 
  PropertyOccupancyPeriod, 
  OccupancyType 
} from '@/types/property-occupancy';

export const usePropertyOccupancy = (propertyId: string | null) => {
  const [vacancyRate, setVacancyRate] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch property occupancy periods
  const {
    data: occupancyPeriods = [],
    isLoading: isLoadingOccupancy,
    refetch: refetchOccupancy,
  } = useQuery({
    queryKey: ['property-occupancy', propertyId],
    queryFn: () => fetchPropertyOccupancyPeriods(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate vacancy rate
  useEffect(() => {
    if (propertyId) {
      calculateVacancyRate(propertyId)
        .then(rate => {
          setVacancyRate(rate);
        })
        .catch(error => {
          console.error('Error calculating vacancy rate:', error);
        });
    }
  }, [propertyId, occupancyPeriods]);

  // Create occupancy period
  const createOccupancyMutation = useMutation({
    mutationFn: createPropertyOccupancyPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-occupancy', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Período de ocupação registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar período de ocupação: ${error.message}`);
    },
  });

  // Update occupancy period
  const updateOccupancyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyOccupancyFormData> }) => 
      updatePropertyOccupancyPeriod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-occupancy', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Período de ocupação atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar período de ocupação: ${error.message}`);
    },
  });

  // Delete occupancy period
  const deleteOccupancyMutation = useMutation({
    mutationFn: deletePropertyOccupancyPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-occupancy', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Período de ocupação excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir período de ocupação: ${error.message}`);
    },
  });

  // Register a new occupancy period
  const registerOccupancy = useCallback(
    (data: Omit<PropertyOccupancyFormData, 'property_id'>) => {
      return createOccupancyMutation.mutateAsync({
        ...data,
        property_id: propertyId || '',
      });
    },
    [propertyId, createOccupancyMutation]
  );

  // End current occupancy period
  const endOccupancy = useCallback(
    (periodId: string, endDate: string) => {
      return updateOccupancyMutation.mutateAsync({
        id: periodId,
        data: { end_date: endDate }
      });
    },
    [updateOccupancyMutation]
  );

  return {
    occupancyPeriods,
    vacancyRate,
    isLoadingOccupancy,
    isCreating: createOccupancyMutation.isPending,
    isUpdating: updateOccupancyMutation.isPending,
    isDeleting: deleteOccupancyMutation.isPending,
    registerOccupancy,
    updateOccupancy: (id: string, data: Partial<PropertyOccupancyFormData>) => 
      updateOccupancyMutation.mutate({ id, data }),
    endOccupancy,
    deleteOccupancy: deleteOccupancyMutation.mutate,
    refetchOccupancy,
  };
};
