
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

// Create a new user for a client using the edge function
export async function createClientUser(userData: CreateClientUserData): Promise<ClientUser> {
  const { data, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "createUser",
      userData
    }
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error.message || "Error creating user");
  
  return data.data;
}

// Reset password for an existing user using the edge function
export async function resetUserPassword(data: ResetPasswordData): Promise<{ success: boolean }> {
  const { data: response, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "resetPassword",
      data
    }
  });

  if (error) throw error;
  if (response.error) throw new Error(response.error.message || "Error resetting password");
  
  return { success: true };
}

// Generate an activation token for a user using the edge function
export async function generateActivationToken(userId: string): Promise<string> {
  const { data: response, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "generateToken",
      userId
    }
  });

  if (error) throw error;
  if (response.error) throw new Error(response.error.message || "Error generating token");
  
  return response.data.token;
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
