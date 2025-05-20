import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptionAnalytics, calculateMrr, getClientDistributionByPlan } from "@/api/subscription-analytics";

// Hook to fetch subscription analytics data
export function useSubscriptionAnalytics() {
  return useQuery({
    queryKey: ["subscription-analytics"],
    queryFn: fetchSubscriptionAnalytics,
    // Keep data fresh, but don't refetch too often
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to calculate current MRR
export function useMrr() {
  return useQuery({
    queryKey: ["mrr"],
    queryFn: calculateMrr,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get client distribution by plan
export function useClientDistributionByPlan() {
  return useQuery({
    queryKey: ["client-distribution"],
    queryFn: getClientDistributionByPlan,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
