
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchUsers, fetchUserById, updateUserProfile, updateUserRole, deleteUser, UserWithRole } from "@/api/users";
import { Database } from "@/integrations/supabase/types";

import { logger } from "@/lib/logger";
// Type for app_role from Supabase
type AppRole = Database["public"]["Enums"]["app_role"];

// Hook para listar usuários
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

// Hook para buscar usuário por ID
export function useUser(userId?: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => (userId ? fetchUserById(userId) : null),
    enabled: !!userId,
  });
}

// Hook para atualizar perfil de usuário
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { first_name?: string; last_name?: string; avatar_url?: string };
    }) => updateUserProfile(userId, data),
    onSuccess: (_, variables) => {
      toast.success("Perfil atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      logger.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar o perfil");
    },
  });
}

// Hook para atualizar função do usuário
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role as AppRole),
    onSuccess: (_, variables) => {
      toast.success("Função atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      logger.error("Erro ao atualizar função:", error);
      toast.error("Erro ao atualizar função do usuário");
    },
  });
}

// Hook para excluir usuário
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      logger.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
    },
  });
}
