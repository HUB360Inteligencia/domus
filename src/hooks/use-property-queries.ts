
import { useQuery } from '@tanstack/react-query';
import { fetchProperties, fetchPropertyById } from '@/api/properties';

export const usePropertyQueries = (selectedPropertyId: string | null = null) => {
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
  
  // Add a specific method to fetch property details by ID
  const usePropertyDetails = (propertyId: string) => {
    const { data, isLoading, error } = useQuery({
      queryKey: ['property', propertyId],
      queryFn: () => fetchPropertyById(propertyId),
      enabled: !!propertyId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
    
    return { data, isLoading, error };
  };
  
  return {
    properties,
    selectedProperty,
    isLoadingProperties,
    isLoadingSelectedProperty,
    refetchProperties,
    refetchSelectedProperty,
    isLoading: isLoadingProperties || isLoadingSelectedProperty,
    usePropertyDetails
  };
};
