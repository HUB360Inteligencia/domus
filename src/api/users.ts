
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from "@/lib/auth";
import { Database } from "@/integrations/supabase/types";

import { logger } from "@/lib/logger";
// Type for app_role from Supabase
type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserWithRole extends Omit<AuthUser, 'role'> {
  role?: AppRole | string;
  created_at?: string;
  last_sign_in_at?: string | null;
}

// Buscar todos os usuários (created_at e last_sign_in_at vêm de auth.users,
// acessíveis apenas via a RPC SECURITY DEFINER admin_list_users).
export async function fetchUsers(): Promise<UserWithRole[]> {
  try {
    const { data, error } = await supabase.rpc("admin_list_users");

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      created_at: row.created_at,
      last_sign_in_at: row.last_sign_in_at,
      profile: {
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
      } as AuthUser["profile"],
    }));
  } catch (error) {
    logger.error("Erro ao buscar usuários:", error);
    throw error;
  }
}

// Buscar usuário por ID
export async function fetchUserById(userId: string): Promise<UserWithRole | null> {
  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        // Registro não encontrado
        return null;
      }
      throw profileError;
    }

    // Buscar função/papel do usuário
    const { data: role } = await supabase.rpc("get_user_role", {
      user_id: userId
    });

    // Montar objeto de usuário
    return {
      id: profile.id,
      email: profile.email,
      profile,
      role,
    };
  } catch (error) {
    logger.error(`Erro ao buscar usuário ${userId}:`, error);
    throw error;
  }
}

// Atualizar perfil do usuário
export async function updateUserProfile(
  userId: string,
  data: { first_name?: string; last_name?: string; avatar_url?: string }
) {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar perfil:", error);
    throw error;
  }
}

// Atualizar função do usuário
export async function updateUserRole(userId: string, roleName: AppRole) {
  try {
    // Buscar ID da função pelo nome
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (roleError) throw roleError;

    // Verificar se o usuário já tem uma função atribuída
    const { data: userRole, error: userRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (userRoleError) throw userRoleError;

    let result;

    if (userRole && userRole.length > 0) {
      // Atualizar função existente
      result = await supabase
        .from("user_roles")
        .update({ role_id: roleData.id })
        .eq("user_id", userId);
    } else {
      // Criar nova entrada de função
      result = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleData.id });
    }

    if (result.error) throw result.error;

    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar função do usuário:", error);
    throw error;
  }
}

// Excluir usuário (apenas perfil, não remove da auth)
export async function deleteUser(userId: string) {
  try {
    // Remove primeiro das funções
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    
    // Remove o perfil
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    logger.error("Erro ao excluir usuário:", error);
    throw error;
  }
}
