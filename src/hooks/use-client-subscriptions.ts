
import { useQuery } from "@tanstack/react-query";
import { fetchClientSubscriptions } from "@/api/subscriptions";

// Hook para buscar assinaturas de um cliente específico
export function useClientSubscriptions(clientId?: string) {
  return useQuery({
    queryKey: ["clientSubscriptions", clientId],
    queryFn: () => (clientId ? fetchClientSubscriptions(clientId) : Promise.resolve([])),
    enabled: !!clientId,
  });
}
