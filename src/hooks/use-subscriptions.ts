
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { 
  fetchSubscriptions,
  fetchClientSubscriptions,
  fetchSubscriptionById,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  fetchSubscriptionInvoices,
  createInvoice,
  payInvoice,
  cancelInvoice,
  Subscription,
  Invoice
} from "@/api/subscriptions";

// Hook para listar todas as assinaturas
export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
  });
}

// Hook para listar assinaturas de um cliente
export function useClientSubscriptions(clientId?: string) {
  return useQuery({
    queryKey: ["subscriptions", "client", clientId],
    queryFn: () => (clientId ? fetchClientSubscriptions(clientId) : []),
    enabled: !!clientId,
  });
}

// Hook para buscar assinatura por ID
export function useSubscription(subscriptionId?: string) {
  return useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: () => (subscriptionId ? fetchSubscriptionById(subscriptionId) : null),
    enabled: !!subscriptionId,
  });
}

// Hook para criar nova assinatura
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscription: Omit<Subscription, "id" | "created_at" | "updated_at" | "client" | "plan">) => 
      createSubscription(subscription),
    onSuccess: (data) => {
      toast.success("Assinatura criada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "client", data.client_id] });
    },
    onError: (error) => {
      logger.error("Erro ao criar assinatura:", error);
      toast.error("Erro ao criar assinatura");
    },
  });
}

// Hook para atualizar assinatura existente
export function useUpdateSubscription(subscriptionId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscription: Partial<Omit<Subscription, "id" | "created_at" | "updated_at" | "client" | "plan">>) => 
      updateSubscription(subscriptionId!, subscription),
    onSuccess: (data) => {
      toast.success("Assinatura atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "client", data.client_id] });
    },
    onError: (error) => {
      logger.error("Erro ao atualizar assinatura:", error);
      toast.error("Erro ao atualizar assinatura");
    },
  });
}

// Hook para cancelar assinatura
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subscriptionId: string) => cancelSubscription(subscriptionId),
    onSuccess: (data) => {
      toast.success("Assinatura cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", data.id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "client", data.client_id] });
    },
    onError: (error) => {
      logger.error("Erro ao cancelar assinatura:", error);
      toast.error("Erro ao cancelar assinatura");
    },
  });
}

// Hook para listar faturas de uma assinatura
export function useSubscriptionInvoices(subscriptionId?: string) {
  return useQuery({
    queryKey: ["invoices", "subscription", subscriptionId],
    queryFn: () => (subscriptionId ? fetchSubscriptionInvoices(subscriptionId) : []),
    enabled: !!subscriptionId,
  });
}

// Hook para criar nova fatura
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoice: Omit<Invoice, "id" | "created_at" | "updated_at">) => 
      createInvoice(invoice),
    onSuccess: (data) => {
      toast.success("Fatura criada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["invoices", "subscription", data.subscription_id] });
    },
    onError: (error) => {
      logger.error("Erro ao criar fatura:", error);
      toast.error("Erro ao criar fatura");
    },
  });
}

// Hook para marcar fatura como paga
export function usePayInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, paymentMethod }: { invoiceId: string; paymentMethod: string }) => 
      payInvoice(invoiceId, paymentMethod),
    onSuccess: (data) => {
      toast.success("Pagamento registrado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["invoices", "subscription", data.subscription_id] });
    },
    onError: (error) => {
      logger.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    },
  });
}

// Hook para cancelar fatura
export function useCancelInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoiceId: string) => cancelInvoice(invoiceId),
    onSuccess: (data) => {
      toast.success("Fatura cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["invoices", "subscription", data.subscription_id] });
    },
    onError: (error) => {
      logger.error("Erro ao cancelar fatura:", error);
      toast.error("Erro ao cancelar fatura");
    },
  });
}
