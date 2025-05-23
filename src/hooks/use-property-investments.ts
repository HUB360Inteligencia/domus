
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyInvestments, 
  createPropertyInvestment, 
  deletePropertyInvestment,
  uploadInvestmentReceipt,
  calculateTotalInvestment
} from '@/api/property-investments';
import { PropertyInvestmentFormData, PropertyInvestment, InvestmentType } from '@/types/property-investment';

export const usePropertyInvestments = (propertyId: string | null) => {
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const queryClient = useQueryClient();

  // Fetch property investments
  const {
    data: investments = [],
    isLoading: isLoadingInvestments,
    refetch: refetchInvestments,
  } = useQuery({
    queryKey: ['property-investments', propertyId],
    queryFn: () => fetchPropertyInvestments(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate total investment
  useEffect(() => {
    if (propertyId) {
      calculateTotalInvestment(propertyId)
        .then(total => {
          setTotalInvestment(total);
        })
        .catch(error => {
          console.error('Error calculating total investment:', error);
        });
    }
  }, [propertyId, investments]);

  // Create investment
  const createInvestmentMutation = useMutation({
    mutationFn: createPropertyInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-investments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Investimento registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar investimento: ${error.message}`);
    },
  });

  // Delete investment
  const deleteInvestmentMutation = useMutation({
    mutationFn: deletePropertyInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-investments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast.success('Investimento excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir investimento: ${error.message}`);
    },
  });

  // Upload receipt
  const uploadReceiptMutation = useMutation({
    mutationFn: uploadInvestmentReceipt,
    onSuccess: () => {
      toast.success('Comprovante enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar comprovante: ${error.message}`);
    },
  });

  // Register a new investment
  const registerInvestment = useCallback(
    async (data: Omit<PropertyInvestmentFormData, 'property_id'>, receiptFile?: File) => {
      try {
        let receiptUrl = undefined;
        
        // Upload receipt if provided
        if (receiptFile) {
          receiptUrl = await uploadReceiptMutation.mutateAsync(receiptFile);
        }
        
        // Create investment with receipt URL
        await createInvestmentMutation.mutateAsync({
          ...data,
          property_id: propertyId || '',
          receipt_url: receiptUrl,
        });
        
        return true;
      } catch (error) {
        console.error('Error registering investment:', error);
        return false;
      }
    },
    [propertyId, uploadReceiptMutation, createInvestmentMutation]
  );

  return {
    investments,
    totalInvestment,
    isLoadingInvestments,
    isCreating: createInvestmentMutation.isPending,
    isDeleting: deleteInvestmentMutation.isPending,
    isUploading: uploadReceiptMutation.isPending,
    registerInvestment,
    deleteInvestment: deleteInvestmentMutation.mutate,
    refetchInvestments,
  };
};
