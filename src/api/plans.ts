
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  features?: Record<string, any>;
  max_properties?: number;
  max_users?: number;
  interval: 'monthly' | 'yearly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Buscar todos os planos
export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("price");

  if (error) throw error;
  
  return data || [];
}

// Buscar plano por ID
export async function fetchPlanById(planId: string): Promise<Plan | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Registro não encontrado
    throw error;
  }

  return data;
}

// Criar novo plano
export async function createPlan(plan: Omit<Plan, "id" | "created_at" | "updated_at">): Promise<Plan> {
  const { data, error } = await supabase
    .from("plans")
    .insert(plan)
    .select()
    .single();

  if (error) throw error;
  
  return data;
}

// Atualizar plano existente
export async function updatePlan(planId: string, plan: Partial<Omit<Plan, "id" | "created_at" | "updated_at">>): Promise<Plan> {
  const { data, error } = await supabase
    .from("plans")
    .update(plan)
    .eq("id", planId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Ativar/desativar plano
export async function togglePlanStatus(planId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("plans")
    .update({ is_active: isActive })
    .eq("id", planId);

  if (error) throw error;
}

// Excluir plano
export async function deletePlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId);

  if (error) throw error;
}
