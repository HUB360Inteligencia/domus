
import { useQuery } from "@tanstack/react-query";
import { fetchProperties, fetchPropertyById } from "@/api/properties";
import { toast } from 'sonner';

export const usePropertyQueries = (selectedPropertyId: string | null) => {
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      try {
        const data = await fetchProperties();
        console.log('Properties data fetched:', data);
        return data;
      } catch (error) {
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
  });

  const propertyQuery = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: async () => {
      try {
        if (!selectedPropertyId) {
          console.log('No property ID provided for fetching details');
          return null;
        }
        console.log(`Fetching property details for ID: ${selectedPropertyId}`);
        const data = await fetchPropertyById(selectedPropertyId);
        console.log('Property detail fetch result:', data);
        return data;
      } catch (error) {
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
