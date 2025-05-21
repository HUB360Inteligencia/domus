
import { useQuery } from "@tanstack/react-query";
import { 
  fetchContractStats, 
  calculateFinancialStats, 
  generateFinancialChartData, 
  fetchUpcomingEvents,
  fetchRecentContracts
} from "@/api/contract-analytics";

// Hook to fetch contract statistics
export function useContractStats() {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: fetchContractStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to calculate financial statistics
export function useFinancialStats() {
  return useQuery({
    queryKey: ["financial-stats"],
    queryFn: calculateFinancialStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to generate financial chart data
export function useFinancialChartData() {
  return useQuery({
    queryKey: ["financial-chart"],
    queryFn: generateFinancialChartData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch upcoming events
export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: fetchUpcomingEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch recent contracts
export function useRecentContracts() {
  return useQuery({
    queryKey: ["recent-contracts"],
    queryFn: fetchRecentContracts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
