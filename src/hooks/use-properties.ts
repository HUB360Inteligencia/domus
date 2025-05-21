
import { useState, useCallback } from 'react';
import { Property, PropertyFormData } from '@/types/property';
import { usePropertyQueries } from './use-property-queries';
import { usePropertyMutations } from './use-property-mutations';
import { useCurrentUserClientId } from './use-client-users';

export const useProperties = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { data: clientId } = useCurrentUserClientId();

  const setSelectedPropertyIdCallback = useCallback((id: string | null) => {
    setSelectedPropertyId(id);
  }, []);

  const { 
    properties, 
    selectedProperty,
    isLoading,
    isLoadingProperties,
    refetchProperties,
    refetchSelectedProperty
  } = usePropertyQueries(selectedPropertyId);

  const {
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading
  } = usePropertyMutations();

  return {
    // Data
    properties,
    selectedProperty,
    clientId,
    
    // Loading states
    isLoading,
    isLoadingProperties,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading,
    
    // Actions
    setSelectedPropertyId: setSelectedPropertyIdCallback,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    
    // Refetch functions
    refetchProperties,
    refetchSelectedProperty
  };
};
