
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
import { parseCurrencyInput } from '@/utils/currency';

export const usePropertyInvestments = (propertyId: string | null) => {
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const queryClient = useQueryClient();

  const {
    data: investments = [],
    isLoading: isLoadingInvestments,
    refetch: refetchInvestments,
  } = useQuery({
    queryKey: ['property-investments', propertyId],
    queryFn: () => fetchPropertyInvestments(propertyId || ''),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5,
  });

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

  const createInvestmentMutation = useMutation({
    mutationFn: createPropertyInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-investments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Investimento registrado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating investment:', error);
      toast.error(`Erro ao registrar investimento: ${error.message}`);
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: deletePropertyInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-investments', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Investimento excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting investment:', error);
      toast.error(`Erro ao excluir investimento: ${error.message}`);
    },
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: uploadInvestmentReceipt,
    onSuccess: () => {
      toast.success('Comprovante enviado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error uploading receipt:', error);
      toast.error(`Erro ao enviar comprovante: ${error.message}`);
    },
  });

  const registerInvestment = useCallback(
    async (data: Omit<PropertyInvestmentFormData, 'property_id'>, receiptFile?: File) => {
      try {
        console.log('Registering investment with data:', data);
        
        let receiptUrl = undefined;
        
        if (receiptFile) {
          receiptUrl = await uploadReceiptMutation.mutateAsync(receiptFile);
        }
        
        // Enhanced parsing that properly handles zero values
        const amountValue = typeof data.amount === 'string' 
          ? parseCurrencyInput(data.amount) 
          : data.amount;
          
        console.log('Parsed amount value:', amountValue);
          
        // Allow zero values for investments
        if (isNaN(amountValue) || amountValue < 0) {
          throw new Error('Valor do investimento deve ser um número válido (zero ou positivo)');
        }
        
        const investmentData: PropertyInvestmentFormData = {
          ...data,
          amount: amountValue,
          property_id: propertyId || '',
          receipt_url: receiptUrl,
        };
        
        console.log('Final investment data:', investmentData);
        
        await createInvestmentMutation.mutateAsync(investmentData);
        
        return true;
      } catch (error) {
        console.error('Error registering investment:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao registrar investimento');
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
