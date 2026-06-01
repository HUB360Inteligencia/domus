
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { 
  fetchClients, 
  fetchClientById, 
  createClient, 
  updateClient, 
  toggleClientStatus,
  deleteClient,
  Client
} from "@/api/clients";

// Hook para listar todos os clientes
export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
}

// Hook para buscar cliente por ID
export function useClient(clientId?: string) {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: () => (clientId ? fetchClientById(clientId) : null),
    enabled: !!clientId,
  });
}

// Hook para criar novo cliente
export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (client: Omit<Client, "id" | "created_at" | "updated_at">) => 
      createClient(client),
    onSuccess: () => {
      toast.success("Cliente criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      logger.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    },
  });
}

// Hook para atualizar cliente existente
export function useUpdateClient(clientId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (client: Partial<Omit<Client, "id" | "created_at" | "updated_at">>) => 
      updateClient(clientId!, client),
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    },
    onError: (error) => {
      logger.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    },
  });
}

// Hook para ativar/desativar cliente
export function useToggleClientStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, isActive }: { clientId: string; isActive: boolean }) => 
      toggleClientStatus(clientId, isActive),
    onSuccess: (_, variables) => {
      const status = variables.isActive ? "ativado" : "desativado";
      toast.success(`Cliente ${status} com sucesso`);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.clientId] });
    },
    onError: (error) => {
      logger.error("Erro ao alterar status do cliente:", error);
      toast.error("Erro ao alterar status do cliente");
    },
  });
}

// Hook para excluir cliente
export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      logger.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    },
  });
}
