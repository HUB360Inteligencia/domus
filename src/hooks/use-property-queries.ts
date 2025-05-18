
import { useQuery } from "@tanstack/react-query";
import { fetchProperties, fetchPropertyById } from "@/api/properties";

export const usePropertyQueries = (selectedPropertyId: string | null) => {
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  const propertyQuery = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: () => fetchPropertyById(selectedPropertyId as string),
    enabled: !!selectedPropertyId,
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  return {
    properties: propertiesQuery.data || [],
    selectedProperty: propertyQuery.data,
    isLoading: propertiesQuery.isLoading || propertyQuery.isLoading,
  };
};
