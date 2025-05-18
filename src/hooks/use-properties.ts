
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Property, PropertyFormData } from '@/types/property';
import { usePropertyQueries } from './use-property-queries';
import { usePropertyMutations } from './use-property-mutations';

export const useProperties = () => {
  const { user } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Use useCallback to stabilize function references
  const setSelectedPropertyIdCallback = useCallback((id: string | null) => {
    setSelectedPropertyId(id);
  }, []);

  const { properties, selectedProperty, isLoading } = usePropertyQueries(selectedPropertyId);
  
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
    properties,
    selectedProperty,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading,
    setSelectedPropertyId: setSelectedPropertyIdCallback,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
  };
};
