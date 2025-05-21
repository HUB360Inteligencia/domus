
import { useQuery } from '@tanstack/react-query';
import { fetchPropertyById } from '@/api/properties';
import { Property } from '@/types/property';

export function usePropertyDetails(propertyId: string) {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => fetchPropertyById(propertyId),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
