
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

import { logger } from "@/lib/logger";
export interface MrrData {
  month: string;
  value: number;
  growth_rate?: number;
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  clientsByPlan: { planName: string; count: number }[];
  retentionRate: number;
  churnRate: number;
}

export interface SubscriptionAnalytics {
  currentMrr: number;
  mrrGrowthRate: number;
  historicalMrr: MrrData[];
  clientMetrics: ClientMetrics;
  averageRevenuePerUser: number;
}

// Fetch real subscription analytics data from Supabase
export async function fetchSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
  // Fetch current subscriptions to calculate MRR
  const { data: activeSubscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select(`
      id,
      client_id,
      plan_id,
      status,
      starts_at,
      plans (
        name,
        price,
        interval
      )
    `)
    .eq('status', 'active');

  if (subscriptionsError) {
    logger.error('Error fetching subscriptions:', subscriptionsError);
    throw subscriptionsError;
  }

  // Calculate current MRR and collect historical data points
  const currentMrr = calculateMrrFromSubscriptions(activeSubscriptions || []);
  
  // Fetch client data
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, is_active');

  if (clientsError) {
    logger.error('Error fetching clients:', clientsError);
    throw clientsError;
  }

  // Calculate client distribution by plan
  const clientsByPlan = getClientDistributionFromSubscriptions(activeSubscriptions || []);
  
  // Calculate total and active clients
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(client => client.is_active).length || 0;
  
  // Calculate retention and churn rates
  const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
  const churnRate = 100 - retentionRate;
  
  // Calculate average revenue per user
  const averageRevenuePerUser = activeClients > 0 ? Math.round(currentMrr / activeClients) : 0;

  // Histórico real: MRR das assinaturas vigentes no fim de cada mês (pelas datas de início/fim)
  const { data: allSubscriptions, error: historyError } = await supabase
    .from('subscriptions')
    .select('status, starts_at, ends_at, plans ( price, interval )');

  if (historyError) {
    logger.error('Error fetching subscription history:', historyError);
  }

  const historicalMrr = buildHistoricalMrr(allSubscriptions || [], currentMrr);
  const mrrGrowthRate = historicalMrr.length >= 2 ? 
    calculateGrowthRate(historicalMrr[historicalMrr.length - 2].value, historicalMrr[historicalMrr.length - 1].value) : 0;

  return {
    currentMrr,
    mrrGrowthRate,
    historicalMrr,
    clientMetrics: {
      totalClients,
      activeClients,
      clientsByPlan,
      retentionRate,
      churnRate
    },
    averageRevenuePerUser
  };
}

// Helper function to calculate MRR from subscription data
const monthlyPrice = (plan?: { price?: number | null; interval?: string | null } | null): number => {
  const price = Number(plan?.price || 0);
  const interval = (plan?.interval || 'month').toLowerCase();
  if (['year', 'yearly', 'annual', 'anual'].includes(interval)) return price / 12;
  if (['quarter', 'quarterly', 'trimestral'].includes(interval)) return price / 3;
  if (['semester', 'semiannual', 'semestral'].includes(interval)) return price / 6;
  return price;
};

function calculateMrrFromSubscriptions(subscriptions: any[]): number {
  return subscriptions.reduce((total, subscription) => {
    if (subscription.plans && subscription.status === 'active') {
      return total + monthlyPrice(subscription.plans);
    }
    return total;
  }, 0);
}

type SubscriptionHistoryRow = {
  status: string;
  starts_at: string;
  ends_at: string | null;
  plans: { price?: number | null; interval?: string | null } | null;
};

/** MRR dos últimos 6 meses a partir das datas das assinaturas (o mês atual usa o MRR vigente). */
function buildHistoricalMrr(subscriptions: SubscriptionHistoryRow[], currentMrr: number): MrrData[] {
  const now = new Date();
  let previousValue: number | null = null;

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = startOfMonth(subMonths(now, 5 - index));
    const isCurrentMonth = index === 5;
    const reference = isCurrentMonth ? now : endOfMonth(monthDate);

    const value = isCurrentMonth
      ? currentMrr
      : subscriptions.reduce((total, subscription) => {
          const startsAt = new Date(subscription.starts_at);
          if (Number.isNaN(startsAt.getTime()) || startsAt > reference) return total;
          if (subscription.ends_at) {
            if (new Date(subscription.ends_at) < reference) return total;
          } else if (subscription.status !== 'active') {
            // Cancelada sem data de término: não há como saber até quando esteve vigente
            return total;
          }
          return total + monthlyPrice(subscription.plans);
        }, 0);

    const growth_rate = previousValue !== null ? calculateGrowthRate(previousValue, value) : 0;
    previousValue = value;
    const label = format(monthDate, 'MMM', { locale: ptBR });

    return { month: label.charAt(0).toUpperCase() + label.slice(1), value: Math.round(value), growth_rate };
  });
}

// Calculate MRR from active subscriptions
export async function calculateMrr(): Promise<number> {
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      plan_id,
      plans (
        price,
        interval
      )
    `)
    .eq('status', 'active');

  if (error) {
    logger.error('Error calculating MRR:', error);
    throw error;
  }

  return calculateMrrFromSubscriptions(subscriptions || []);
}

// Get client distribution by plan
export async function getClientDistributionByPlan(): Promise<{ planName: string; count: number }[]> {
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      client_id,
      plan_id,
      status,
      plans (
        id,
        name
      )
    `)
    .eq('status', 'active');

  if (error) {
    logger.error('Error fetching client distribution:', error);
    throw error;
  }

  return getClientDistributionFromSubscriptions(subscriptions || []);
}

// Helper function to get client distribution from subscriptions
function getClientDistributionFromSubscriptions(subscriptions: any[]): { planName: string; count: number }[] {
  // Count clients by plan
  const planCounts = subscriptions.reduce((counts, subscription) => {
    if (subscription.plans && subscription.plans.name) {
      const planName = subscription.plans.name;
      counts[planName] = (counts[planName] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);

  // Convert to array format
  return Object.entries(planCounts).map(([planName, count]) => ({
    planName,
    count: Number(count) // Ensure count is explicitly a number
  }));
}

// Helper function to calculate growth rate between two values
function calculateGrowthRate(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return parseFloat(((newValue - oldValue) / oldValue * 100).toFixed(1));
}
