
import { supabase } from "@/integrations/supabase/client";
import { Client } from "./clients";
import { Plan } from "./plans";

export interface Subscription {
  id: string;
  client_id: string;
  plan_id: string;
  starts_at: string;
  ends_at?: string;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  payment_status: 'paid' | 'pending' | 'failed';
  is_auto_renewal: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
  plan?: Plan;
}

export interface Invoice {
  id: string;
  subscription_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'canceled';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

// Buscar todas as assinaturas
export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      client:client_id(*),
      plan:plan_id(*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  return data || [];
}

// Buscar assinaturas por cliente
export async function fetchClientSubscriptions(clientId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      client:client_id(*),
      plan:plan_id(*)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  return data || [];
}

// Buscar assinatura por ID
export async function fetchSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      client:client_id(*),
      plan:plan_id(*)
    `)
    .eq("id", subscriptionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Registro não encontrado
    throw error;
  }

  return data;
}

// Criar nova assinatura
export async function createSubscription(subscription: Omit<Subscription, "id" | "created_at" | "updated_at" | "client" | "plan">): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert(subscription)
    .select(`
      *,
      client:client_id(*),
      plan:plan_id(*)
    `)
    .single();

  if (error) throw error;
  
  return data;
}

// Atualizar assinatura existente
export async function updateSubscription(
  subscriptionId: string, 
  subscription: Partial<Omit<Subscription, "id" | "created_at" | "updated_at" | "client" | "plan">>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update(subscription)
    .eq("id", subscriptionId)
    .select(`
      *,
      client:client_id(*),
      plan:plan_id(*)
    `)
    .single();

  if (error) throw error;

  return data;
}

// Cancelar assinatura
export async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ 
      status: 'canceled',
      is_auto_renewal: false 
    })
    .eq("id", subscriptionId)
    .select(`
      *,
      client:client_id(*),
      plan:plan_id(*)
    `)
    .single();

  if (error) throw error;

  return data;
}

// Buscar faturas de uma assinatura
export async function fetchSubscriptionInvoices(subscriptionId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("due_date", { ascending: false });

  if (error) throw error;
  
  return data || [];
}

// Criar nova fatura
export async function createInvoice(invoice: Omit<Invoice, "id" | "created_at" | "updated_at">): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .insert(invoice)
    .select()
    .single();

  if (error) throw error;
  
  return data;
}

// Marcar fatura como paga
export async function payInvoice(invoiceId: string, paymentMethod: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .update({ 
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod
    })
    .eq("id", invoiceId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Cancelar fatura
export async function cancelInvoice(invoiceId: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: 'canceled' })
    .eq("id", invoiceId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
