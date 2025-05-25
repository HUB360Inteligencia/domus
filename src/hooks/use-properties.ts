
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFormData } from '@/types/property';
import { 
  fetchProperties, 
  fetchPropertyById, 
  createProperty as apiCreateProperty,
  updateProperty as apiUpdateProperty,
  deleteProperty as apiDeleteProperty,
  uploadPropertyImage as apiUploadPropertyImage
} from '@/api/properties';

export { type Property } from '@/types/property';

export const useProperties = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all properties
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties
  });

  // Fetch selected property
  const { data: selectedProperty, isLoading: isLoadingSelected } = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: () => selectedPropertyId ? fetchPropertyById(selectedPropertyId) : null,
    enabled: !!selectedPropertyId
  });

  // Create property mutation
  const { mutateAsync: createProperty, isPending: isCreating } = useMutation({
    mutationFn: apiCreateProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });

  // Update property mutation
  const { mutateAsync: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: apiUpdateProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      if (selectedPropertyId) {
        queryClient.invalidateQueries({ queryKey: ['property', selectedPropertyId] });
      }
    }
  });

  // Delete property mutation
  const { mutateAsync: deleteProperty, isPending: isDeleting } = useMutation({
    mutationFn: apiDeleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setSelectedPropertyId(null);
    }
  });

  // Upload property image mutation
  const { mutateAsync: uploadPropertyImage, isPending: isUploading } = useMutation({
    mutationFn: apiUploadPropertyImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      if (selectedPropertyId) {
        queryClient.invalidateQueries({ queryKey: ['property', selectedPropertyId] });
      }
    }
  });

  return {
    properties,
    isLoading,
    isLoadingProperties: isLoading,
    selectedProperty,
    selectedPropertyId,
    setSelectedPropertyId,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading
  };
};
