
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

  // Generate historical MRR data - in a production app, this would come from historical records
  // For now, we'll simulate it based on the current MRR
  const historicalMrr = generateHistoricalMrrData(currentMrr);
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
function calculateMrrFromSubscriptions(subscriptions: any[]): number {
  return subscriptions.reduce((total, subscription) => {
    if (subscription.plans && subscription.status === 'active') {
      const price = subscription.plans.price || 0;
      // Convert to monthly if not already (assuming 'interval' is either 'month', 'year', etc.)
      if (subscription.plans.interval === 'year') {
        return total + (price / 12);
      }
      return total + price;
    }
    return total;
  }, 0);
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

// Helper function to generate historical MRR data (for demo purposes)
// In a real app, this would come from stored historical records
function generateHistoricalMrrData(currentMrr: number): MrrData[] {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const baseValue = Math.max(currentMrr * 0.7, 10000); // Starting at ~70% of current value
  
  let previousValue = baseValue;
  return months.map((month, index) => {
    // Generate somewhat realistic growth
    const growthFactor = 1 + (Math.random() * 0.08 + 0.02); // 2-10% monthly growth
    const value = index === months.length - 1 
      ? currentMrr 
      : Math.round(previousValue * growthFactor);
    
    const growth_rate = calculateGrowthRate(previousValue, value);
    previousValue = value;
    
    return { month, value, growth_rate };
  });
}

// Helper function to calculate growth rate between two values
function calculateGrowthRate(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return parseFloat(((newValue - oldValue) / oldValue * 100).toFixed(1));
}
