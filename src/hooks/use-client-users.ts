
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientUsers, getCurrentUserClientId, userBelongsToClient } from "@/api/client-users";

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
    mutationFn: (userData: any) => {
      // This is a placeholder - implement the actual API call to create a client user
      console.log("Creating client user:", userData);
      return Promise.resolve(userData);
    },
    onSuccess: () => {
      // Invalidate queries to refetch client users
      queryClient.invalidateQueries({ queryKey: ["client-users"] });
    }
  });
}

// Hook to reset a user's password
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (resetData: { user_id: string; password: string }) => {
      // This is a placeholder - implement the actual API call to reset a password
      console.log("Resetting password for user:", resetData.user_id);
      return Promise.resolve(resetData);
    }
  });
}
