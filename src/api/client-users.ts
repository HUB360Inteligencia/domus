
import { supabase } from "@/integrations/supabase/client";

export interface ClientUser {
  id: string;
  user_id: string;
  client_id: string;
  is_primary: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  generated_password?: string;
  must_change_password?: boolean;
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
  password?: string;
  use_generic_password?: boolean;
  first_name?: string;
  last_name?: string;
  is_primary?: boolean;
  role?: string;
  must_change_password?: boolean;
}

export interface CreateOrganizationWithUserData {
  // Organization fields
  org_name: string;
  org_email: string;
  org_phone?: string;
  org_document_number?: string;
  // User fields
  user_email: string;
  user_password?: string;
  use_generic_password?: boolean;
  user_first_name?: string;
  user_last_name?: string;
  user_role?: string;
  must_change_password?: boolean;
}

export interface ResetPasswordData {
  user_id: string;
  password: string;
}

export interface ChangeOwnPasswordData {
  user_id: string;
  new_password: string;
}

type ClientUserFunctionRow = {
  id: string;
  user_id: string;
  client_id: string;
  is_primary: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  generated_password?: string;
  must_change_password?: boolean;
  profiles?: ClientUser["profile"];
  profile?: ClientUser["profile"];
};

function mapClientUser(item: ClientUserFunctionRow): ClientUser {
  return {
    id: item.id,
    user_id: item.user_id,
    client_id: item.client_id,
    is_primary: item.is_primary,
    role: item.role,
    created_at: item.created_at,
    updated_at: item.updated_at,
    generated_password: item.generated_password,
    must_change_password: item.must_change_password,
    profile: item.profile ?? item.profiles,
  };
}

// Fetch users for a specific client
export async function fetchClientUsers(clientId: string): Promise<ClientUser[]> {
  const { data, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "getClientUsers",
      client_id: clientId
    }
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error.message || "Error fetching users");
  
  const usersList = (data.data || []) as ClientUserFunctionRow[];
  
  return usersList.map(mapClientUser);
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
  
  return mapClientUser(data.data as ClientUserFunctionRow);
}

// Create an organization AND its first admin user in one step
export async function createOrganizationWithUser(orgData: CreateOrganizationWithUserData) {
  const { data, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "createOrganizationWithUser",
      orgData
    }
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error.message || "Error creating organization with user");
  
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

// Change own password (user-initiated, also clears must_change_password)
export async function changeOwnPassword(data: ChangeOwnPasswordData): Promise<{ success: boolean }> {
  const { data: response, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "changeOwnPassword",
      data
    }
  });

  if (error) throw error;
  if (response.error) throw new Error(response.error.message || "Error changing password");
  
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
