
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';

export const usePropertyActiveContract = (propertyId: string | null) => {
  const { data: activeContract, isLoading } = useQuery({
    queryKey: ['active-contract', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching active contract:', error);
        return null;
      }

      return data as unknown as Contract;
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    activeContract,
    isLoading,
    hasActiveContract: !!activeContract
  };
};
