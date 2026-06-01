
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { 
  fetchClientUsers, 
  getCurrentUserClientId, 
  userBelongsToClient,
  createClientUser,
  resetUserPassword,
  CreateClientUserData,
  ResetPasswordData
} from "@/api/client-users";

// Hook to get client users for a specific client
export function useClientUsers(clientId?: string) {
  return useQuery({
    queryKey: ["client-users", clientId],
    queryFn: () => fetchClientUsers(clientId || ""),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get the client ID for the current user
export function useCurrentUserClientId() {
  return useQuery({
    queryKey: ["current-user-client-id"],
    queryFn: getCurrentUserClientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to check if the current user belongs to a specific client
export function useUserBelongsToClient(clientId?: string) {
  return useQuery({
    queryKey: ["user-belongs-to-client", clientId],
    queryFn: () => clientId ? userBelongsToClient(clientId) : Promise.resolve(false),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to create a client user
export function useCreateClientUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateClientUserData) => createClientUser(userData),
    onSuccess: (_, variables) => {
      toast.success("Usuário criado com sucesso");
      // Invalidate queries to refetch client users
      queryClient.invalidateQueries({ queryKey: ["client-users", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["client-users"] });
    },
    onError: (error) => {
      logger.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário");
    }
  });
}

// Hook to reset a user's password
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (resetData: ResetPasswordData) => resetUserPassword(resetData),
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso");
    },
    onError: (error) => {
      logger.error("Erro ao redefinir senha:", error);
      toast.error("Erro ao redefinir senha");
    }
  });
}
