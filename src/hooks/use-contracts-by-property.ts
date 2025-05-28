
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/contract';

export const useContractsByProperty = (propertyId: string | null) => {
  const { data: contracts = [], isLoading, refetch } = useQuery({
    queryKey: ['contracts', 'property', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          property:properties(
            title,
            address,
            city,
            state,
            neighborhood,
            type,
            tags
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching property contracts:', error);
        throw error;
      }

      return data as Contract[];
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Find active contract
  const activeContract = contracts.find(contract => contract.status === 'active');
  
  // Get current rental value from active contract or fallback to property rental_value
  const getCurrentRentalValue = (propertyRentalValue?: number) => {
    return activeContract?.value || propertyRentalValue || 0;
  };

  return {
    contracts,
    activeContract,
    getCurrentRentalValue,
    isLoading,
    refetch,
    hasActiveContract: !!activeContract
  };
};
