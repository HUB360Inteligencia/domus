
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActivityFormData, ActivityStatus } from "@/types/activity";
import { 
  createActivity, 
  updateActivity, 
  deleteActivity,
  updateActivityStatus,
  convertActivityToExpense
} from "@/api/activities";

export const useActivityMutations = () => {
  const queryClient = useQueryClient();

  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Atividade criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar atividade: ${error.message}`);
    }
  });

  const updateActivityMutation = useMutation({
    mutationFn: updateActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Atividade atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar atividade: ${error.message}`);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActivityStatus }) => 
      updateActivityStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });

  const deleteActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Atividade excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir atividade: ${error.message}`);
    }
  });

  const convertToExpenseMutation = useMutation({
    mutationFn: convertActivityToExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['property_expenses'] });
      toast.success('Atividade convertida em despesa com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao converter em despesa: ${error.message}`);
    }
  });

  return {
    createActivity: createActivityMutation.mutateAsync,
    updateActivity: updateActivityMutation.mutate,
    updateActivityStatus: updateStatusMutation.mutate,
    deleteActivity: deleteActivityMutation.mutate,
    convertToExpense: convertToExpenseMutation.mutate,
    isCreating: createActivityMutation.isPending,
    isUpdating: updateActivityMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteActivityMutation.isPending,
    isConverting: convertToExpenseMutation.isPending,
  };
};
