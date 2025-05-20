
import { supabase } from "@/integrations/supabase/client";

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

// This function would eventually be implemented to fetch real data from Supabase
export async function fetchSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
  // In a real implementation, we'd fetch this data from Supabase
  // For now, we're returning mock data
  
  // Example query that would be implemented:
  // const { data: subscriptionData, error } = await supabase
  //   .from('subscriptions')
  //   .select(`
  //     id,
  //     status,
  //     client_id,
  //     plan_id,
  //     starts_at,
  //     plans (
  //       name,
  //       price
  //     )
  //   `)
  //   .eq('status', 'active');

  // Mock data for now
  return {
    currentMrr: 58500,
    mrrGrowthRate: 8.5,
    historicalMrr: [
      { month: "Jan", value: 35000, growth_rate: 0 },
      { month: "Fev", value: 38000, growth_rate: 8.6 },
      { month: "Mar", value: 42000, growth_rate: 10.5 },
      { month: "Abr", value: 45000, growth_rate: 7.1 },
      { month: "Mai", value: 52000, growth_rate: 15.6 },
      { month: "Jun", value: 58500, growth_rate: 12.5 }
    ],
    clientMetrics: {
      totalClients: 120,
      activeClients: 110,
      clientsByPlan: [
        { planName: "Basic", count: 45 },
        { planName: "Pro", count: 52 },
        { planName: "Enterprise", count: 23 }
      ],
      retentionRate: 92,
      churnRate: 8
    },
    averageRevenuePerUser: 531.82
  };
}

// Function to calculate MRR from active subscriptions
export async function calculateMrr(): Promise<number> {
  // This would be implemented to calculate actual MRR from the database
  // For now, returning a mock value
  return 58500;
}

// Function to get client distribution by plan
export async function getClientDistributionByPlan(): Promise<{ planName: string; count: number }[]> {
  // This would be implemented to fetch actual client distribution from the database
  // For now, returning mock data
  return [
    { planName: "Basic", count: 45 },
    { planName: "Pro", count: 52 },
    { planName: "Enterprise", count: 23 }
  ];
}
