
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Database } from "@/integrations/supabase/types";

export interface ClientUser {
  id: string;
  user_id: string;
  client_id: string;
  is_primary: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface CreateClientUserData {
  client_id: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_primary?: boolean;
  role?: string;
}

export interface ResetPasswordData {
  user_id: string;
  password: string;
}

// Fetch users for a specific client
export async function fetchClientUsers(clientId: string): Promise<ClientUser[]> {
  const { data, error } = await supabase
    .from("client_users")
    .select(`
      *,
      profiles:user_id(
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq("client_id", clientId);

  if (error) throw error;
  
  return data?.map(item => ({
    ...item,
    profile: item.profiles as ClientUser['profile']
  })) || [];
}

// Create a new user for a client
export async function createClientUser(userData: CreateClientUserData): Promise<ClientUser> {
  // Step 1: Create the user in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      first_name: userData.first_name,
      last_name: userData.last_name,
    }
  });

  if (authError) throw authError;
  
  if (!authData.user) {
    throw new Error("Erro ao criar usuário");
  }

  // Step 2: Create entry in client_users table
  const { data: clientUserData, error: clientUserError } = await supabase
    .from("client_users")
    .insert({
      user_id: authData.user.id,
      client_id: userData.client_id,
      is_primary: userData.is_primary || false,
      role: userData.role || 'user',
    })
    .select("*")
    .single();

  if (clientUserError) {
    // Cleanup: If there was an error, delete the auth user we just created
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw clientUserError;
  }

  return {
    ...clientUserData,
    profile: {
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
    }
  };
}

// Reset password for an existing user
export async function resetUserPassword(data: ResetPasswordData): Promise<{ success: boolean }> {
  const { error } = await supabase.auth.admin.updateUserById(
    data.user_id,
    { password: data.password }
  );

  if (error) throw error;
  
  return { success: true };
}

// Generate an activation token for a user
export async function generateActivationToken(userId: string): Promise<string> {
  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token valid for 24 hours
  
  const { error } = await supabase
    .from("profiles")
    .update({
      activation_token: token,
      activation_token_expires_at: expires.toISOString()
    })
    .eq("id", userId);
  
  if (error) throw error;
  
  return token;
}

// Get the client ID for the current authenticated user
export async function getCurrentUserClientId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("user_id", user.id)
    .single();
  
  if (error || !data) return null;
  
  return data.client_id;
}

// Check if the current user belongs to a specific client
export async function userBelongsToClient(clientId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data, error } = await supabase
    .from("client_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .single();
  
  return !error && !!data;
}
