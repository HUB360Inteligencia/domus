
import { useQuery } from '@tanstack/react-query';
import { fetchContractById } from '@/api/contracts';
import { Contract } from '@/types/contract';

export function useContractDetails(contractId: string) {
  return useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => fetchContractById(contractId),
    enabled: !!contractId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
