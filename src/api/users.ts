
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from "@/lib/auth";

export interface UserWithRole extends Omit<AuthUser, 'role'> {
  role?: string;
  created_at?: string;
}

// Buscar todos os usuários
export async function fetchUsers(): Promise<UserWithRole[]> {
  try {
    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) throw profilesError;

    // Converter para o formato esperado
    const users: UserWithRole[] = await Promise.all(
      profiles.map(async (profile) => {
        // Buscar função/papel do usuário
        const { data: role } = await supabase.rpc("get_user_role", {
          user_id: profile.id
        });

        // Montar objeto de usuário
        return {
          id: profile.id,
          email: profile.email,
          profile,
          role,
        };
      })
    );

    return users;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
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
    console.error(`Erro ao buscar usuário ${userId}:`, error);
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
    console.error("Erro ao atualizar perfil:", error);
    throw error;
  }
}

// Atualizar função do usuário
export async function updateUserRole(userId: string, roleName: string) {
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
    console.error("Erro ao atualizar função do usuário:", error);
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
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
}
