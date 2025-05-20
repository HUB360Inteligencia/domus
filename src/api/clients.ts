
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Buscar todos os clientes
export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) throw error;
  
  return data || [];
}

// Buscar cliente por ID
export async function fetchClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Registro não encontrado
    throw error;
  }

  return data;
}

// Criar novo cliente
export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  
  return data;
}

// Atualizar cliente existente
export async function updateClient(clientId: string, client: Partial<Omit<Client, "id" | "created_at" | "updated_at">>): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(client)
    .eq("id", clientId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Ativar/desativar cliente
export async function toggleClientStatus(clientId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", clientId);

  if (error) throw error;
}

// Excluir cliente
export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) throw error;
}
