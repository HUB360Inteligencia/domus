import { useQuery } from "@tanstack/react-query";
import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";

type PlanInfo = { name?: string | null; price?: number | null; interval?: string | null } | null;

type SubscriptionRow = {
  id: string;
  status: string;
  payment_status: string | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  plans: PlanInfo;
  clients: { name?: string | null } | null;
};

type ClientRow = { id: string; name: string; is_active: boolean; created_at: string };

const monthlyPrice = (plan: PlanInfo) => {
  const price = Number(plan?.price || 0);
  const interval = (plan?.interval || "month").toLowerCase();
  if (["year", "yearly", "annual", "anual"].includes(interval)) return price / 12;
  if (["quarter", "quarterly", "trimestral"].includes(interval)) return price / 3;
  if (["semester", "semiannual", "semestral"].includes(interval)) return price / 6;
  return price;
};

const isActiveAt = (subscription: SubscriptionRow, reference: Date) => {
  const startsAt = new Date(subscription.starts_at);
  if (Number.isNaN(startsAt.getTime()) || startsAt > reference) return false;
  if (subscription.ends_at) return new Date(subscription.ends_at) >= reference;
  return subscription.status === "active";
};

const monthLabel = (date: Date) => {
  const label = format(date, "MMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export interface AdminInsights {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  newClientsPreviousMonth: number;
  clientAcquisition: { month: string; clientes: number }[];
  averageTicket: { month: string; ticket: number }[];
  revenueByPlan: { plan: string; mrr: number; assinaturas: number }[];
  upcomingRenewals: { id: string; clientName: string; planName: string; endsAt: string; value: number }[];
  recentActivity: { id: string; label: string; detail: string; date: string }[];
}

async function fetchAdminInsights(): Promise<AdminInsights> {
  const [clientsResult, subscriptionsResult] = await Promise.all([
    supabase.from("clients").select("id, name, is_active, created_at"),
    supabase
      .from("subscriptions")
      .select("id, status, payment_status, starts_at, ends_at, created_at, plans ( name, price, interval ), clients ( name )"),
  ]);

  if (clientsResult.error) throw clientsResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;

  const clients = (clientsResult.data || []) as ClientRow[];
  const subscriptions = (subscriptionsResult.data || []) as unknown as SubscriptionRow[];
  const now = new Date();

  const months = Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(now, 5 - index)));

  const clientAcquisition = months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const count = clients.filter((client) => {
      const createdAt = new Date(client.created_at);
      return createdAt >= monthStart && createdAt <= monthEnd;
    }).length;
    return { month: monthLabel(monthStart), clientes: count };
  });

  const averageTicket = months.map((monthStart, index) => {
    const reference = index === months.length - 1 ? now : endOfMonth(monthStart);
    const active = subscriptions.filter((subscription) => isActiveAt(subscription, reference));
    const mrr = active.reduce((sum, subscription) => sum + monthlyPrice(subscription.plans), 0);
    return { month: monthLabel(monthStart), ticket: active.length > 0 ? Math.round(mrr / active.length) : 0 };
  });

  const planTotals = new Map<string, { mrr: number; assinaturas: number }>();
  subscriptions
    .filter((subscription) => isActiveAt(subscription, now))
    .forEach((subscription) => {
      const plan = subscription.plans?.name || "Sem plano";
      const entry = planTotals.get(plan) || { mrr: 0, assinaturas: 0 };
      entry.mrr += monthlyPrice(subscription.plans);
      entry.assinaturas += 1;
      planTotals.set(plan, entry);
    });
  const revenueByPlan = [...planTotals.entries()]
    .map(([plan, totals]) => ({ plan, mrr: Math.round(totals.mrr), assinaturas: totals.assinaturas }))
    .sort((a, b) => b.mrr - a.mrr);

  const renewalLimit = addDays(now, 30);
  const upcomingRenewals = subscriptions
    .filter((subscription) => {
      if (!subscription.ends_at || subscription.status === "canceled" || subscription.status === "cancelled") return false;
      const endsAt = new Date(subscription.ends_at);
      return endsAt >= now && endsAt <= renewalLimit;
    })
    .sort((a, b) => new Date(a.ends_at as string).getTime() - new Date(b.ends_at as string).getTime())
    .map((subscription) => ({
      id: subscription.id,
      clientName: subscription.clients?.name || "Cliente",
      planName: subscription.plans?.name || "Plano",
      endsAt: subscription.ends_at as string,
      value: monthlyPrice(subscription.plans),
    }));

  const recentActivity = [
    ...clients.map((client) => ({
      id: `client-${client.id}`,
      label: "Nova organização",
      detail: client.name,
      date: client.created_at,
    })),
    ...subscriptions.map((subscription) => ({
      id: `subscription-${subscription.id}`,
      label: "Assinatura criada",
      detail: `${subscription.clients?.name || "Cliente"} · ${subscription.plans?.name || "Plano"}`,
      date: subscription.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const thisMonthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));

  return {
    totalClients: clients.length,
    activeClients: clients.filter((client) => client.is_active).length,
    newClientsThisMonth: clients.filter((client) => new Date(client.created_at) >= thisMonthStart).length,
    newClientsPreviousMonth: clients.filter((client) => {
      const createdAt = new Date(client.created_at);
      return createdAt >= previousMonthStart && createdAt < thisMonthStart;
    }).length,
    clientAcquisition,
    averageTicket,
    revenueByPlan,
    upcomingRenewals,
    recentActivity,
  };
}

export function useAdminInsights() {
  return useQuery({
    queryKey: ["admin-insights"],
    queryFn: fetchAdminInsights,
    staleTime: 60_000,
  });
}
