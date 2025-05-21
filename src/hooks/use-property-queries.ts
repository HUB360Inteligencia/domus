import { useQuery } from "@tanstack/react-query";
import { fetchProperties, fetchPropertyById } from "@/api/properties";
import { toast } from 'sonner';

export const usePropertyQueries = (selectedPropertyId: string | null, clientId: string | null | undefined) => {
  const propertiesQuery = useQuery({
    queryKey: ['properties', clientId],
    queryFn: async () => {
      try {
        // Update this line to match the API function signature
        // If the API function doesn't accept clientId anymore, remove it
        const data = await fetchProperties();
        console.log('Properties data fetched:', data);
        return data;
      } catch (error: any) {
        console.error('Error fetching properties:', error);
        // Dispatch a custom event for 401 errors
        if (error.message?.includes('401') || error.status === 401) {
          window.dispatchEvent(new CustomEvent('fetch-error', { 
            detail: { status: 401, message: 'Unauthorized' }
          }));
        }
        toast.error(`Erro ao carregar imóveis: ${error.message || 'Erro desconhecido'}`);
        return [];
      }
    },
    retry: 1,
    staleTime: 60000, // 1 minute
    enabled: true, // We want to fetch properties even if we don't have a clientId, RLS will filter it
  });

  const propertyQuery = useQuery({
    queryKey: ['property', selectedPropertyId, clientId],
    queryFn: async () => {
      try {
        if (!selectedPropertyId) {
          console.log('No property ID provided for fetching details');
          return null;
        }
        console.log(`Fetching property details for ID: ${selectedPropertyId}`);
        // RLS will ensure we only get property details if the user belongs to the client
        const data = await fetchPropertyById(selectedPropertyId);
        console.log('Property detail fetch result:', data);
        return data;
      } catch (error: any) {
        console.error(`Error fetching property ${selectedPropertyId}:`, error);
        toast.error(`Erro ao carregar detalhes do imóvel: ${error.message || 'Erro desconhecido'}`);
        return null;
      }
    },
    enabled: !!selectedPropertyId,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  return {
    properties: propertiesQuery.data || [],
    selectedProperty: propertyQuery.data,
    isLoading: propertiesQuery.isLoading || propertyQuery.isLoading,
    error: propertiesQuery.error || propertyQuery.error,
  };
};
