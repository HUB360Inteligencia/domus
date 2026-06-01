
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { 
  fetchPlans, 
  fetchPlanById, 
  createPlan, 
  updatePlan, 
  togglePlanStatus,
  deletePlan,
  Plan
} from "@/api/plans";

// Hook para listar todos os planos
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });
}

// Hook para buscar plano por ID
export function usePlan(planId?: string) {
  return useQuery({
    queryKey: ["plan", planId],
    queryFn: () => (planId ? fetchPlanById(planId) : null),
    enabled: !!planId,
  });
}

// Hook para criar novo plano
export function useCreatePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (plan: Omit<Plan, "id" | "created_at" | "updated_at">) => 
      createPlan(plan),
    onSuccess: () => {
      toast.success("Plano criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error) => {
      logger.error("Erro ao criar plano:", error);
      toast.error("Erro ao criar plano");
    },
  });
}

// Hook para atualizar plano existente
export function useUpdatePlan(planId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (plan: Partial<Omit<Plan, "id" | "created_at" | "updated_at">>) => 
      updatePlan(planId!, plan),
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
    },
    onError: (error) => {
      logger.error("Erro ao atualizar plano:", error);
      toast.error("Erro ao atualizar plano");
    },
  });
}

// Hook para ativar/desativar plano
export function useTogglePlanStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, isActive }: { planId: string; isActive: boolean }) => 
      togglePlanStatus(planId, isActive),
    onSuccess: (_, variables) => {
      const status = variables.isActive ? "ativado" : "desativado";
      toast.success(`Plano ${status} com sucesso`);
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", variables.planId] });
    },
    onError: (error) => {
      logger.error("Erro ao alterar status do plano:", error);
      toast.error("Erro ao alterar status do plano");
    },
  });
}

// Hook para excluir plano
export function useDeletePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (planId: string) => deletePlan(planId),
    onSuccess: () => {
      toast.success("Plano excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error) => {
      logger.error("Erro ao excluir plano:", error);
      toast.error("Erro ao excluir plano");
    },
  });
}
