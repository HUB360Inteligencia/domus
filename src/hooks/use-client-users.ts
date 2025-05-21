
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  fetchClientUsers, 
  createClientUser, 
  resetUserPassword, 
  generateActivationToken,
  getCurrentUserClientId,
  userBelongsToClient,
  ClientUser,
  CreateClientUserData,
  ResetPasswordData
} from "@/api/client-users";

// Hook for fetching users for a specific client
export function useClientUsers(clientId?: string) {
  return useQuery({
    queryKey: ["client-users", clientId],
    queryFn: () => (clientId ? fetchClientUsers(clientId) : Promise.resolve([])),
    enabled: !!clientId,
  });
}

// Hook for creating a new user for a client
export function useCreateClientUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateClientUserData) => createClientUser(userData),
    onSuccess: (_, variables) => {
      toast.success("Usuário criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["client-users", variables.client_id] });
    },
    onError: (error) => {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário: " + (error as Error).message);
    },
  });
}

// Hook for resetting a user's password
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordData) => resetUserPassword(data),
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar senha:", error);
      toast.error("Erro ao atualizar senha: " + (error as Error).message);
    },
  });
}

// Hook for generating activation token
export function useGenerateActivationToken() {
  return useMutation({
    mutationFn: (userId: string) => generateActivationToken(userId),
    onSuccess: () => {
      toast.success("Link de ativação gerado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao gerar link de ativação:", error);
      toast.error("Erro ao gerar link de ativação");
    },
  });
}

// Hook for getting the current user's client ID
export function useCurrentUserClientId() {
  return useQuery({
    queryKey: ["current-user-client-id"],
    queryFn: getCurrentUserClientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for checking if the current user belongs to a specific client
export function useUserBelongsToClient(clientId?: string) {
  return useQuery({
    queryKey: ["user-belongs-to-client", clientId],
    queryFn: () => (clientId ? userBelongsToClient(clientId) : Promise.resolve(false)),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
