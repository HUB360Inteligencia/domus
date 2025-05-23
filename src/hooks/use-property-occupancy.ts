
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyOccupancy,
  createPropertyOccupancy,
  updatePropertyOccupancy,
  deletePropertyOccupancy,
  updatePropertyVacancyRate
} from '@/api/property-occupancy';
import { PropertyOccupancyFormData } from '@/types/property-occupancy';

export const usePropertyOccupancy = (propertyId: string | null) => {
  const queryClient = useQueryClient();

  const { data: occupancyPeriods = [], isLoading } = useQuery({
    queryKey: ['propertyOccupancy', propertyId],
    queryFn: () => fetchPropertyOccupancy(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createOccupancyMutation = useMutation({
    mutationFn: (data: PropertyOccupancyFormData) => createPropertyOccupancy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyOccupancy', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Período de ocupação registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar período de ocupação: ${error.message}`);
    }
  });

  const updateOccupancyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyOccupancyFormData> }) => 
      updatePropertyOccupancy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyOccupancy', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Período de ocupação atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar período de ocupação: ${error.message}`);
    }
  });

  const deleteOccupancyMutation = useMutation({
    mutationFn: (id: string) => deletePropertyOccupancy(id, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyOccupancy', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Período de ocupação excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir período de ocupação: ${error.message}`);
    }
  });

  const calculateVacancyMutation = useMutation({
    mutationFn: () => updatePropertyVacancyRate(propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Taxa de vacância calculada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao calcular taxa de vacância: ${error.message}`);
    }
  });

  return {
    occupancyPeriods,
    isLoading,
    isCreating: createOccupancyMutation.isPending,
    isUpdating: updateOccupancyMutation.isPending,
    isDeleting: deleteOccupancyMutation.isPending,
    isCalculating: calculateVacancyMutation.isPending,
    createOccupancy: createOccupancyMutation.mutate,
    updateOccupancy: updateOccupancyMutation.mutate,
    deleteOccupancy: deleteOccupancyMutation.mutate,
    calculateVacancy: calculateVacancyMutation.mutate
  };
};
