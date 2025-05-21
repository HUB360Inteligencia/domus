
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  createPropertyExpense, 
  updatePropertyExpense, 
  deletePropertyExpense,
  uploadExpenseReceipt
} from "@/api/property-expenses";
import { PropertyExpenseFormData } from "@/types/property-expense";

export const usePropertyExpenseMutations = (propertyId: string) => {
  const queryClient = useQueryClient();
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['property-expenses', propertyId] });
  };

  const createExpenseMutation = useMutation({
    mutationFn: createPropertyExpense,
    onSuccess: () => {
      invalidateQueries();
      toast.success('Despesa adicionada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar despesa: ${error.message}`);
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyExpenseFormData> }) => 
      updatePropertyExpense(id, data),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Despesa atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar despesa: ${error.message}`);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deletePropertyExpense(id),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Despesa excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir despesa: ${error.message}`);
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: uploadExpenseReceipt,
    onSuccess: () => {
      invalidateQueries();
      toast.success('Comprovante enviado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar comprovante: ${error.message}`);
    }
  });

  return {
    createExpense: createExpenseMutation.mutate,
    updateExpense: updateExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    uploadReceipt: uploadReceiptMutation.mutate,
    isCreating: createExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
    isUploading: uploadReceiptMutation.isPending
  };
};
