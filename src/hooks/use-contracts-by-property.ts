
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';

import { logger } from "@/lib/logger";
export const useContractsByProperty = (propertyId: string | null) => {
  const { data: contracts = [], isLoading, refetch } = useQuery({
    queryKey: ['contracts', 'property', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching property contracts:', error);
        throw new Error(error.message);
      }

      return data as unknown as Contract[];
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const activeContract = contracts.find(contract => contract.status === 'active');
  
  return {
    contracts,
    activeContract,
    isLoading,
    refetch,
    hasActiveContract: !!activeContract
  };
};
