
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchFinancialTransactions, 
  createFinancialTransaction, 
  updateFinancialTransaction, 
  deleteFinancialTransaction,
  fetchFinancialCategories,
  createFinancialCategory,
  calculateFinancialAnalytics
} from '@/api/financial-transactions';
import { fetchProperties } from '@/api/properties';
import { toast } from 'sonner';
import { FinancialReportFilters, FinancialTransactionFormData } from '@/types/financial';

export const useFinancialTransactions = (filters?: FinancialReportFilters) => {
  return useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: () => fetchFinancialTransactions(filters),
  });
};

export const useFinancialCategories = (type?: 'income' | 'expense') => {
  return useQuery({
    queryKey: ['financial-categories', type],
    queryFn: () => fetchFinancialCategories(type),
  });
};

export const useFinancialAnalytics = (filters?: FinancialReportFilters) => {
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const analyticsQuery = useQuery({
    queryKey: ['financial-analytics', filters],
    queryFn: () => calculateFinancialAnalytics(propertiesQuery.data || [], filters),
    enabled: propertiesQuery.isSuccess,
  });

  return {
    ...analyticsQuery,
    isLoading: propertiesQuery.isLoading || analyticsQuery.isLoading,
  };
};

export const useFinancialMutations = () => {
  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: (data: FinancialTransactionFormData) => createFinancialTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-analytics'] });
      toast.success('Transação financeira registrada com sucesso.');
    },
    onError: (error) => {
      toast.error(`Erro ao registrar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinancialTransactionFormData> }) => 
      updateFinancialTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-analytics'] });
      toast.success('Transação financeira atualizada com sucesso.');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-analytics'] });
      toast.success('Transação financeira excluída com sucesso.');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const createCategory = useMutation({
    mutationFn: ({ name, type }: { name: string; type: 'income' | 'expense' }) => 
      createFinancialCategory(name, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Categoria financeira criada com sucesso.');
    },
    onError: (error) => {
      toast.error(`Erro ao criar categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
  };
};
