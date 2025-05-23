
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyInvestments,
  createPropertyInvestment,
  updatePropertyInvestment,
  deletePropertyInvestment,
  uploadInvestmentReceipt
} from '@/api/property-investments';
import { PropertyInvestmentFormData } from '@/types/property-investment';

export const usePropertyInvestments = (propertyId: string | null) => {
  const queryClient = useQueryClient();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['propertyInvestments', propertyId],
    queryFn: () => fetchPropertyInvestments(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createInvestmentMutation = useMutation({
    mutationFn: createPropertyInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyInvestments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['propertyFinancial', propertyId] });
      toast.success('Investimento registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar investimento: ${error.message}`);
    }
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyInvestmentFormData> }) => 
      updatePropertyInvestment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyInvestments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['propertyFinancial', propertyId] });
      toast.success('Investimento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar investimento: ${error.message}`);
    }
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: (id: string) => deletePropertyInvestment(id, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyInvestments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['propertyFinancial', propertyId] });
      toast.success('Investimento excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir investimento: ${error.message}`);
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: ({ file, investmentId }: { file: File; investmentId: string }) => 
      uploadInvestmentReceipt(file, investmentId, propertyId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyInvestments', propertyId] });
      toast.success('Comprovante enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar comprovante: ${error.message}`);
    }
  });

  return {
    investments,
    isLoading,
    isCreating: createInvestmentMutation.isPending,
    isUpdating: updateInvestmentMutation.isPending,
    isDeleting: deleteInvestmentMutation.isPending,
    isUploading: uploadReceiptMutation.isPending,
    createInvestment: createInvestmentMutation.mutate,
    updateInvestment: updateInvestmentMutation.mutate,
    deleteInvestment: deleteInvestmentMutation.mutate,
    uploadReceipt: uploadReceiptMutation.mutate
  };
};
