
import { useQuery } from '@tanstack/react-query';
import { fetchProperties, fetchPropertyById } from '@/api/properties';

export const usePropertyQueries = (selectedPropertyId: string | null) => {
  // Fetch all properties
  const { 
    data: properties = [], 
    isLoading: isLoadingProperties, 
    refetch: refetchProperties 
  } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
  
  // Fetch selected property details
  const { 
    data: selectedProperty, 
    isLoading: isLoadingSelectedProperty,
    refetch: refetchSelectedProperty 
  } = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: () => fetchPropertyById(selectedPropertyId || ''),
    enabled: !!selectedPropertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return {
    properties,
    selectedProperty,
    isLoadingProperties,
    isLoadingSelectedProperty,
    refetchProperties,
    refetchSelectedProperty,
    isLoading: isLoadingProperties || isLoadingSelectedProperty
  };
};
